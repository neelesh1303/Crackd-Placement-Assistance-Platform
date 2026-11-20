# ---------- Stage 1: build the React app ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Produces static files in /app/dist
RUN npm run build

# ---------- Stage 2: serve the built files with nginx ----------
FROM nginx:alpine
# Our nginx settings (serves React + forwards /api to the backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy ONLY the built files from stage 1 (no node_modules -> tiny image)
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
