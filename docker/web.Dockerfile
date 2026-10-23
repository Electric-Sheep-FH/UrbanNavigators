# Front React : build statique servi par nginx (non root).
#   docker build -f docker/web.Dockerfile -t un-web .

FROM node:22-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile --filter "@un/web..."
RUN pnpm --filter "@un/web..." build

# Branche stable de nginx (numéro pair), maintenue avec les correctifs de sécurité.
FROM nginxinc/nginx-unprivileged:1.31-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
