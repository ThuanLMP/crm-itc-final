# syntax=docker/dockerfile:1.7

############################
# 1) Cài deps bằng Bun (cache tốt)
############################
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
# Sao chép file manifest trước để tối ưu cache
COPY package.json bun.lockb* ./
RUN bun install --ci

############################
# 2) Build sản phẩm
############################
FROM deps AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
# Nếu cần truyền biến build-time cho Vite, dùng ARG rồi map sang ENV
# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN bun run build

############################
# 3) Nginx serve static (SPA)
############################
FROM nginx:1.27-alpine AS runner
# Thêm cấu hình Nginx tối ưu cho SPA + cache tĩnh
RUN /bin/sh -c 'cat > /etc/nginx/conf.d/default.conf << "EOF"\n\
server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
\n\
  # GZIP cơ bản\n\
  gzip on;\n\
  gzip_min_length 1024;\n\
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
\n\
  # Cache file tĩnh mạnh tay\n\
  location ~* \\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|woff2?|ttf)$ {\n\
    access_log off;\n\
    expires 1y;\n\
    add_header Cache-Control \"public, max-age=31536000, immutable\";\n\
    try_files $uri =404;\n\
  }\n\
\n\
  # index.html không cache để nhận bản build mới\n\
  location = /index.html {\n\
    add_header Cache-Control \"no-store\";\n\
  }\n\
\n\
  # Fallback cho React Router (SPA)\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n\
EOF'
# Copy static build
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
