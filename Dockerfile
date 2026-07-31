# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install locked production dependencies first.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy the application into the image.
COPY --chown=node:node . .

# Run the application as the non-root Node user.
USER node

# The application listens on port 3000 inside the container.
EXPOSE 3000

# Docker checks the existing readiness endpoint.
HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=15s \
  --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Run Node directly so shutdown signals reach server.js.
CMD ["node", "server.js"]