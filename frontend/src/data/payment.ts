// Client for the payment backend (backend-payment/). Submits the completed
// checkout form; the service persists the order (mock DB) then hands off to the
// payment provider. During dev, requests hit /payment-api via the Vite proxy;
// set VITE_PAYMENT_API_BASE_URL to point at the service in other environments.
import type { PowertrainKey, VehicleTypeKey } from "./catalog";

const PAYMENT_API_BASE = import.meta.env.VITE_PAYMENT_API_BASE_URL ?? "";

export interface CheckoutOrder {
  vehicle: VehicleTypeKey;
  vehicleLabel: string;
  powertrain: PowertrainKey;
  color: string;
  engine: string;
  total: number;
}

export interface CheckoutRequest {
  customer: Record<string, string>;
  order: CheckoutOrder;
}

export interface CheckoutResponse {
  orderId: string;
  paymentUrl: string;
  status: string;
}

export async function submitOrder(
  request: CheckoutRequest,
  signal?: AbortSignal,
): Promise<CheckoutResponse> {
  const res = await fetch(`${PAYMENT_API_BASE}/payment-api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Checkout failed (${res.status})`);
  }
  return (await res.json()) as CheckoutResponse;
}
