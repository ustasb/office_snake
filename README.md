# Office Snake

Office Snake is a competitive Snake game written in JavaScript.

Challenge mode combines Snake with the classic Minesweeper game.

- [officesnake.com](http://www.officesnake.com)
- Initial release: 10/22/2011
- Author: [Brian Ustas](http://brianustas.com)

Supported Browsers: IE 7+, FireFox 13, Safari 5.1.7, Opera 11.64, Chrome 19

## Usage

First, build the Docker image:

    docker build -t office_snake .

Concatenate source files with:

    docker run -v $(pwd)/public:/opt/office_snake/public office_snake grunt default

To start the service:

    docker run -p 8000:8000 -v $(pwd)/public:/opt/office_snake/public office_snake

Navigate to `http://<docker-ip>:8000` in your browser.

## Development

To rebuild assets when files change:

    fswatch -o public/js | xargs -n1 -I{} docker run -v $(pwd)/public:/opt/office_snake/public office_snake grunt default
