FROM node:22.22.3-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22.22.3-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global @openai/codex@0.157.1
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/private /home/node/.codex && chown -R node:node /app/private /home/node/.codex
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOME=/home/node CODEX_HOME=/home/node/.codex CODEX_BIN=codex
USER node
EXPOSE 3100
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3100"]
