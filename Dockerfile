FROM python:3.6.2-alpine3.6
MAINTAINER Brian Ustas <brianustas@gmail.com>

ARG APP_PATH="/opt/office_snake"

RUN apk add --update \
  nodejs \
  nodejs-npm \
  && rm -rf /var/cache/apk/*

WORKDIR $APP_PATH

# Install dependencies first for caching.
ADD package.json $APP_PATH
ADD package-lock.json $APP_PATH
RUN npm install && npm install -g grunt-cli@1.2.0

COPY . $APP_PATH

EXPOSE 8000
VOLUME $APP_PATH

# -u to stop Python from buffering its output.
CMD grunt default && cd public && python -u -m http.server --cgi 8000
