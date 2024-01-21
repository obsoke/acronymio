ARG DENO_VERSION=1.38.4
FROM denoland/deno:bin-${DENO_VERSION} AS bin

FROM frolvlad/alpine-glibc:alpine-3.13

RUN apk --no-cache add ca-certificates

RUN addgroup --gid 1000 deno \
  && adduser --uid 1000 --disabled-password deno --ingroup deno \
  && mkdir /deno-dir/ \
  && chown deno:deno /deno-dir/

ENV DENO_DIR /deno-dir/
ENV DENO_INSTALL_ROOT /usr/local

ARG DENO_VERSION
ENV DENO_VERSION=${DENO_VERSION}
COPY --from=bin /deno /bin/deno

WORKDIR /deno-dir
COPY . .

ENTRYPOINT ["/bin/deno"]
CMD ["run", "--allow-net", "./src/main.ts"]
