import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load env vars (e.g. VITE_APPINSIGHTS_CONNECTION_STRING) from the parent
  // project .env shared with the backend. Only VITE_* vars are exposed.
  envDir: "..",
  server: {
    port: 5173,
    host: true,
    // Proxy catalog API calls to the local API server (backend/) and checkout
    // calls to the payment service (backend-payment/) during dev.
    proxy: {
      "/api": "http://localhost:3001",
      "/payment-api": "http://localhost:3002",
    },
  },
});
