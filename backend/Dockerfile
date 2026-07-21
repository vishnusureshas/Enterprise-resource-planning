FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY backend/package*.json ./

RUN npm install --production && npm cache clean --force

COPY backend/ .

RUN printf '#!/bin/sh\nset -e\n\necho "Running database migrations..."\nnpm run migrate:up\n\necho "Running seed..."\nnpm run seed\n\necho "Starting server..."\nexec node src/server.js\n' > /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

USER node

ENTRYPOINT ["docker-entrypoint.sh"]
