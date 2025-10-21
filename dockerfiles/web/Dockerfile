FROM node:22-bullseye-slim AS base

RUN corepack enable

RUN corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
RUN pnpm config set registry https://registry.npmmirror.com/

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --only=production

FROM base AS builder
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

FROM base AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p  /app/data

COPY start.sh ./
RUN chmod +x start.sh

COPY .env ./

RUN chown -R nextjs:nodejs /app

ENV NODE_ENV=production

VOLUME ["/app/data"]

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./start.sh"]
CMD ["node", "server.js"]
