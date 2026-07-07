FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace frontend --include-workspace-root=false

FROM deps AS build
WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY frontend frontend

RUN npm run build --workspace frontend

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

COPY frontend/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
