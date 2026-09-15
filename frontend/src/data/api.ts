// Read-only client for the catalog API (server/) which loads colors, engines
// and settings from Azure SQL. During dev, requests hit /api via the Vite
// proxy; set VITE_API_BASE_URL to point at the API in other environments.
import type { Color, Engine, PowertrainKey } from "./catalog";

export interface CatalogData {
  colors: Color[];
  engines: Record<PowertrainKey, Engine[]>;
  maintenanceMode: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogData> {
  const res = await fetch(`${API_BASE}/api/catalog`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load catalog (${res.status})`);
  }
  return (await res.json()) as CatalogData;
}
