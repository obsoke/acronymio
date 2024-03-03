FROM denoland/deno:1.41.1

EXPOSE 8080

WORKDIR /app

USER deno

COPY deps.ts .
RUN deno cache deps.ts

COPY . .
RUN deno cache src/main.ts

CMD ["run", "--allow-net", "./src/main.ts"]
