FROM node:21 as build
WORKDIR /app

ENV VITE_SOCKET_ADDR wss://acroserver.fly.dev

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.25.3
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
