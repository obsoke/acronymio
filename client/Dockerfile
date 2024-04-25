FROM nginx:1.25.3

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci
RUN npm run build

COPY ./dist /usr/share/nginx/html

EXPOSE 80
