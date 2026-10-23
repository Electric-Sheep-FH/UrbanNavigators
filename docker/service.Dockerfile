# Image commune à tous les services NestJS du monorepo.
#   docker build -f docker/service.Dockerfile --build-arg SERVICE=identity -t un-identity .

FROM node:25-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Couche de dépendances : ne change que si le lockfile change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
ARG SERVICE
RUN test -n "$SERVICE" || (echo "--build-arg SERVICE=<nom> est obligatoire" && exit 1)
# "@un/x..." = le service et les librairies dont il dépend.
RUN pnpm install --offline --frozen-lockfile --filter "@un/${SERVICE}..."
RUN pnpm --filter "@un/${SERVICE}..." build
# Copie autonome du service et de ses seules dépendances de production, aux versions du lockfile.
RUN pnpm --filter "@un/${SERVICE}" deploy --prod --offline /out

FROM node:25-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
# UID numérique : Kubernetes peut ainsi vérifier runAsNonRoot.
USER 1000
EXPOSE 3000
CMD ["node", "dist/main.js"]
