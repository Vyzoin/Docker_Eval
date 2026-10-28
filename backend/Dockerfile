# syntax=docker/dockerfile:1
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./

FROM base AS deps-prod
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --omit=dev

FROM base AS development
ENV NODE_ENV=development
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci
COPY --chown=node:node . .
EXPOSE 3001
CMD ["node", "--watch", "src/index.js"]

FROM base AS production
ENV NODE_ENV=production \
    PORT=3001
COPY --from=deps-prod --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node src ./src
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/index.js"]