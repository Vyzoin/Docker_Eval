ARG NODE_VERSION=24
ARG NGINX_TAG=stable-alpine

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci

FROM base AS development
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS build
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY --chown=node:node . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:${NGINX_TAG} AS production
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
