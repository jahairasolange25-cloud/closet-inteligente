FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tini && \
    mkdir -p /app/uploads/temp /app/logs && \
    chown -R node:node /app/uploads /app/logs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/ ./scripts/
COPY src/database/migrations/ ./src/database/migrations/
EXPOSE 4000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node scripts/run-migrations.js && node dist/main"]
