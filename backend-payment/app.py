import os

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from opentelemetry import trace

# Load the application root .env (one directory up) so the shared
# APPINSIGHTS_CONNECTION_STRING is available, then any local overrides.
load_dotenv(os.path.join(os.path.dirname(__file__), os.pardir, ".env"))
load_dotenv()

# Wire up Azure Application Insights before Flask and the instrumented
# libraries (requests) start handling traffic. Auto-instrumentation records
# the outbound payment call as a dependency, so connection failures surface
# in App Insights. Skipped when no connection string is configured.
APPINSIGHTS_CONNECTION_STRING = os.getenv("APPINSIGHTS_CONNECTION_STRING")
print(f"APPINSIGHTS_CONNECTION_STRING: {APPINSIGHTS_CONNECTION_STRING}")

if APPINSIGHTS_CONNECTION_STRING:
    from azure.monitor.opentelemetry import configure_azure_monitor

    os.environ.setdefault("OTEL_SERVICE_NAME", "backend-payment")
    configure_azure_monitor(connection_string=APPINSIGHTS_CONNECTION_STRING)

from db import save_order

app = Flask(__name__)

# `Flask` is imported above before configure_azure_monitor runs, so this app is
# built from the un-patched class and misses Flask auto-instrumentation — its
# requests (including failed 5xx) would never reach App Insights. Instrument the
# app instance explicitly so request telemetry is recorded.
if APPINSIGHTS_CONNECTION_STRING:
    from opentelemetry.instrumentation.flask import FlaskInstrumentor

    FlaskInstrumentor().instrument_app(app)

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/payment-api/*": {"origins": CORS_ORIGIN}})

# Downstream payment provider. Deliberately unreachable for the demo — the
# handoff below is expected to fail so the checkout surfaces a payment outage.
PAYMENT_URL = os.getenv("PAYMENT_URL", "https://doesnotexist.xxxxxxx")
PAYMENT_TIMEOUT = float(os.getenv("PAYMENT_TIMEOUT", "5"))

# Fixed error code shown to the user and recorded on the failed request in
# Application Insights. Mirrors the frontend PAYMENT_ERROR_CODE so the code the
# customer sees matches what an SRE finds when querying App Insights.
PAYMENT_ERROR_CODE = "PAY-MSUTY3ZE-1OFQ"


@app.get("/payment-api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/payment-api/checkout")
def checkout():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    # 1. Persist the order (mocked database for now).
    try:
        order_id = save_order(payload)
    except Exception:
        app.logger.exception("Failed to persist order")
        return jsonify({"error": "Could not save order"}), 500

    # 2. Hand the stored order off to the payment provider.
    try:
        forward_to_payment(order_id, payload)
    except requests.RequestException as exc:
        # Tag the auto-instrumented request span with the payment error code and
        # attach the exception, so the failed request in App Insights is
        # searchable by PAYMENT_ERROR_CODE and links to the underlying failure.
        span = trace.get_current_span()
        span.set_attribute("payment.error_code", PAYMENT_ERROR_CODE)
        span.record_exception(exc, attributes={"payment.error_code": PAYMENT_ERROR_CODE})
        app.logger.exception("Payment provider unreachable [%s]: %s", PAYMENT_ERROR_CODE, exc)
        detail = None if os.getenv("FLASK_ENV") == "production" else str(exc)
        return (
            jsonify(
                {
                    "error": "Payment service unavailable",
                    "errorCode": PAYMENT_ERROR_CODE,
                    "orderId": order_id,
                    "detail": detail,
                }
            ),
            502,
        )

    return jsonify({"orderId": order_id, "paymentUrl": PAYMENT_URL, "status": "forwarded"})


def forward_to_payment(order_id, payload):
    response = requests.post(
        PAYMENT_URL,
        json={"orderId": order_id, **payload},
        timeout=PAYMENT_TIMEOUT,
    )
    response.raise_for_status()
    return response


if __name__ == "__main__":
    port = int(os.getenv("PORT_BACKEND_PAYMENT", "3002"))
    app.run(host="127.0.0.1", port=port)
