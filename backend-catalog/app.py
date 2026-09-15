import os
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv()

from db import get_colors, get_engines, get_maintenance_mode

app = Flask(__name__)

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGIN}})


def api_route(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return jsonify(fn(*args, **kwargs))
        except Exception as exc:  # surfaced to the client only outside production
            app.logger.exception("%s failed", fn.__name__)
            detail = None if os.getenv("FLASK_ENV") == "production" else str(exc)
            return jsonify({"error": "Internal server error", "detail": detail}), 500

    return wrapper


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/colors")
@api_route
def colors():
    return get_colors()


@app.get("/api/engines")
@api_route
def engines():
    return get_engines()


# Single round trip used by the front-end on startup.
@app.get("/api/catalog")
@api_route
def catalog():
    return {
        "colors": get_colors(),
        "engines": get_engines(),
        "maintenanceMode": get_maintenance_mode(),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3001"))
    app.run(host="127.0.0.1", port=port)
