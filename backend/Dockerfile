FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY backend/prisma backend/prisma

RUN npm ci --workspace backend --include-workspace-root=false \
  && npx prisma generate --schema backend/prisma/schema.prisma

FROM deps AS build
WORKDIR /app

COPY backend backend

RUN npm run build --workspace backend

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY backend/prisma backend/prisma

RUN npm ci --omit=dev --workspace backend --include-workspace-root=false \
  && npx prisma generate --schema backend/prisma/schema.prisma \
  && npm cache clean --force

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma

USER node

EXPOSE 4000

CMD ["node", "backend/dist/src/main.js"]
