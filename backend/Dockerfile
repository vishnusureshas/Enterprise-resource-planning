FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN printf '#!/bin/sh\nset -e\n\necho "Running database migrations..."\nnpm run migrate:up\n\necho "Starting server..."\nexec node src/server.js\n' > /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

USER node

ENTRYPOINT ["docker-entrypoint.sh"]
