FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN mkdir -p /app/uploads/temp && \
    chown -R node:node /app/uploads
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 4000
USER node
CMD ["node", "dist/main"]
