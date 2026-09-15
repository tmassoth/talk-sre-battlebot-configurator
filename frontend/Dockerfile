# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# vite build (skips the tsc project-reference step) produces the static bundle.
RUN npx vite build

# --- runtime stage ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Regenerates env-config.js from container env vars before nginx starts.
COPY docker-entrypoint.d/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
