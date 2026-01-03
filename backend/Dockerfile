FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN apk add --no-cache libc6-compat && \
    yarn install --frozen-lockfile --production=false

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn prisma generate && \
    yarn build

FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma

# Install production dependencies and generate Prisma client
RUN yarn install --production --frozen-lockfile && \
    npx prisma generate && \
    yarn cache clean

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Add startup script that runs migrations before starting the app
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

RUN chown -R nestjs:nodejs /app && \
    chmod -R 755 /app

USER nestjs

EXPOSE 3001
ENV PORT=3001

CMD ["sh", "./docker-entrypoint.sh"]
