# ---------- Stage 1: Build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY ./package.json ./package-lock.json* ./
RUN npm install

RUN npm ci    
COPY . .
RUN npm run build   # Vite -> output: /app/dist

# ---------- Stage 2: Serve by nginx ----------
FROM nginx:alpine

# Copy bundle (Vite: dist; CRA thì đổi 'dist' thành 'build')
COPY --from=build /app/dist /usr/share/nginx/html

# *** QUAN TRỌNG: copy cấu hình SPA fallback ***
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]