FROM node:24-bookworm

WORKDIR /usr/app

RUN apt-get update -y && apt-get install -y openssl ca-certificates fuse3 sqlite3 curl
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs
COPY litefs.yml /etc/litefs.yml

RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.3/migrate.linux-arm64.tar.gz | tar xvz

COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/

ENTRYPOINT litefs mount
