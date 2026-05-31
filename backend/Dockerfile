FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tini && \
    mkdir -p /app/uploads/temp && \
    chown -R node:node /app/uploads
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 4000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
