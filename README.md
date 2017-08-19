# Office Snake

**A JavaScript Snake/Minesweeper Game**

[ustasb.com/officesnake] (http://ustasb.com/officesnake)

Initial release: 10/22/2011

Supported Browsers: IE 7+, FireFox 13, Safari 5.1.7, Opera 11.64, Chrome 19

## Usage

First, build the Docker image:

    docker build -t office_snake .

Concatenate source files with:

    ./recompile_assets.sh

To start the service:

    docker run -p 8000:8000 office_snake

Navigate to `http://<docker-ip>:8000` in your browser.

## Development

To rebuilt assets when files change:

    fswatch -o src | xargs -n1 -I{} ./recompile_assets.sh
