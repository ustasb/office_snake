var Engine = {
    isOn: false,
    waitingForInput: true,
    time: 0,
    powerUpDuration: 5,
    powerUpToggleTime: 0,
    powerOn: function () {
        Engine.isOn = true;
        Engine.gameLoop();
        Engine.tick();
    },
    gameLoop: function () {
        if (!Engine.isOn) {
            return;
        }

        if (State.enteringPortal) {
            Helpers.enterPortal();
        } else {
            Engine.waitingForInput = true;

            // If animate() returns true, the snake is still alive.
            if (Snake.animate()) {

                if (Snake.segsToCreate !== 0) {
                    (new SnakeSegment()).create();
                    Snake.segsToCreate -= 1;

                    if (Snake.segsToKill[0]) {
                        // If dead segments are pending for removal and the
                        // snake grows, reapply the 'deadSnakeSeg' class.
                        $(".deadSnakeSeg").removeClass("deadSnakeSeg");
                        Snake.killSegments(Snake.segsToKill[0],
                                           Snake.segsToKill[1], true);
                    }
                }

                if (Snake.segsToKill[0] > 0 &&
                    Snake.segsToKill[1] <= Engine.time) {
                    Snake.removeDeadSegments();
                }

            } else {
                Engine.isOn = false;
                setTimeout(View.gameOver, 500);
            }
        }

        setTimeout(Engine.gameLoop, Snake.speed);
    },
    countdown: function (seconds) {
        if (seconds > 0) {
            $("#countdown div:last-child").text(seconds);

            setTimeout(function () {
                Engine.countdown(seconds - 1);
            }, 1000);
        } else {
            $("#countdown").remove();
            Engine.powerOn();
        }
    },
    tick: function () {
        if (Engine.isOn) {
            Engine.time += 1;

            if (Engine.time >= Engine.powerUpToggleTime +
                               Engine.powerUpDuration) {
                PickUp.togglePowerUp();
            }

            var time = View.formatTimeStr(Engine.time);
            $("#clock").text(time);

            clearTimeout(this.timer);
            this.timer = setTimeout(Engine.tick, 1000);
        }
    },
    pause: function () {
        if (Engine.isOn) {
            Engine.isOn = false;

            if (document.getElementById("powerUpTimeBar")) {
                $("#powerUpTimeBar").stop();
            }

            View.centerElement($("#pauseMenu")).show();
        }
    },
    resume: function () {
        $("#pauseMenu").hide();

        if (document.getElementById("powerUpTimeBar")) {
            // The time remaining on the power-up before the pause.
            var powerUpTimeRemain = Engine.powerUpToggleTime +
                                    Engine.powerUpDuration - Engine.time;
            View.powerUpTimeBar(powerUpTimeRemain);
        }

        Engine.powerOn();
    }
};
