FROM debian:bookworm as go-builder

RUN apt-get update -y && apt-get install -y curl

ENV GOPATH="${HOME}/go"
ENV PATH="${HOME}/go/bin:${PATH}"
RUN curl -L https://go.dev/dl/go1.24.4.linux-amd64.tar.gz | tar --directory /usr/local --extract --gzip
RUN /usr/local/go/bin/go install -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3

FROM node:24-bookworm as base
WORKDIR /usr/app

RUN apt-get update -y && apt-get install -y openssl ca-certificates fuse3 sqlite3 curl

COPY --from=go-builder /go/bin/migrate /usr/local/bin/migrate
COPY migrations ./migrations/

COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs
COPY litefs.yml /etc/litefs.yml

COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/

ENTRYPOINT litefs mount
