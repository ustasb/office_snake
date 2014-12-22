FROM python:3.4.2
MAINTAINER Brian Ustas <brianustas@gmail.com>

RUN apt-get -y update && \
    apt-get -y install git

RUN git clone https://github.com/ustasb/office_snake.git /srv/www/office_snake && \
    rm -rf /srv/www/office_snake/.git && \
    chmod -R 777 /srv/www/office_snake  # The Python CGI server requires 'other' write access...

WORKDIR /srv/www/office_snake

VOLUME /srv/www/office_snake

EXPOSE 8000

# -u to stop Python from buffering its output.
CMD ["python", "-u", "-m", "http.server", "--cgi", "8000"]
