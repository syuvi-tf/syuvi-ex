FROM node:24-bookworm

WORKDIR /usr/app

COPY package.json package-lock.json ./
RUN npm install
COPY src/ ./src/

RUN apt-get update -y && apt-get install -y openssl ca-certificates fuse3 sqlite3
COPY --from=flyio/litefs:0.5 /usr/local/bin/litefs /usr/local/bin/litefs
COPY litefs.yml /etc/litefs.yml

ENTRYPOINT litefs mount
