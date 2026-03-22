FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

USER node

EXPOSE 3000

CMD ["node", "app.js"]
