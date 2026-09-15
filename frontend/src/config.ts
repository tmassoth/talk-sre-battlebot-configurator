// Runtime configuration. Values injected by the container entrypoint via
// window.__APP_CONFIG__ (see public/env-config.js + docker-entrypoint.d/) take
// precedence so a Kubernetes ConfigMap can toggle behavior without rebuilding
// the static bundle. Falls back to Vite's build-time env for local dev.
const runtime = window.__APP_CONFIG__ ?? {};

export const MAINTENANCE_MODE =
  (runtime.VITE_MAINTENANCE_MODE ?? import.meta.env.VITE_MAINTENANCE_MODE) === "true";
