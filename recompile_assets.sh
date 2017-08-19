#!/usr/bin/env bash

docker run \
  -v $(pwd)/src:/srv/www/office_snake/src \
  -v $(pwd)/dist:/srv/www/office_snake/dist \
  office_snake grunt default
