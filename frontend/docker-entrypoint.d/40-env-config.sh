#!/bin/sh
set -e

# Regenerate the runtime config consumed by index.html's env-config.js <script>
# from the container environment. Runs on every startup, so a Kubernetes
# ConfigMap change takes effect after a pod restart — no image rebuild needed.
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = { VITE_MAINTENANCE_MODE: "${VITE_MAINTENANCE_MODE:-false}" };
EOF
