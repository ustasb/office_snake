FROM python:3.6.2-alpine3.6
MAINTAINER Brian Ustas <brianustas@gmail.com>

ARG APP_PATH="/srv/www/office_snake"

RUN apk add --update \
  nodejs \
  nodejs-npm \
  && rm -rf /var/cache/apk/*

COPY . $APP_PATH
WORKDIR $APP_PATH

# The Python CGI server requires 'other' write access...
RUN chmod -R 777 $APP_PATH

RUN npm install && npm install -g grunt-cli

EXPOSE 8000
VOLUME $APP_PATH

# -u to stop Python from buffering its output.
CMD ["python", "-u", "-m", "http.server", "--cgi", "8000"]
