# Сервер лиги Level Up для своего сервера (без Cloudflare).
FROM node:22-alpine
WORKDIR /app
COPY package.json worker.js schema.sql ./
COPY node ./node
ENV NODE_NO_WARNINGS=1 PORT=8787 HOST=0.0.0.0 DB_PATH=/data/levelup.db
EXPOSE 8787
CMD ["node", "node/server.mjs"]
