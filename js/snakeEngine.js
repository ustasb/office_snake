var SnakeEngine = {
    isOn: false,
    waitingForInput: true,
    time: 0,
    powerUpDuration: 5,
    powerUpToggleTime: 0,
    powerOn: function () {
        SnakeEngine.isOn = true;
        SnakeEngine.gameLoop();
        SnakeEngine.tick();
    },
    gameLoop: function () {
        if (!SnakeEngine.isOn) {
            return;
        }

        if (SnakeCache.enteringPortal) {
            SnakeHelpers.enterPortal();
        } else {
            SnakeEngine.waitingForInput = true;
            
            // If animate() returns true, the snake is still alive.
            if (Snake.animate()) {
                
                if (Snake.segsToCreate !== 0) {
                    (new SnakeSegment()).create();
                    Snake.segsToCreate -= 1;
                    
                    if (Snake.segsToKill[0]) {
                        // If dead segments are pending for removal and the snake grows, reapply the 'deadSnakeSeg' class.
                        $(".deadSnakeSeg").removeClass("deadSnakeSeg");
                        Snake.killSegments(Snake.segsToKill[0], Snake.segsToKill[1], true);
                    }
                }
                
                if (Snake.segsToKill[0] > 0 && Snake.segsToKill[1] <= SnakeEngine.time) {
                    Snake.removeDeadSegments(); // Remove the dead segments.
                }
                
            } else {
                SnakeEngine.isOn = false;
                                        
                setTimeout(SnakeView.gameOver, 500);
            }
        }
        
        setTimeout(SnakeEngine.gameLoop, Snake.speed);
    },
    countdown: function (seconds) {
        if (seconds > 0) {
            $("#countdown div:last-child").text(seconds);
        
            setTimeout(function () {
                SnakeEngine.countdown(seconds - 1);
            }, 1000);
        } else {
            $("#countdown").remove();
            SnakeEngine.powerOn();
        }
    },
    tick: function () {
        if (SnakeEngine.isOn) {
            SnakeEngine.time += 1;
            
            if (SnakeEngine.time >= (SnakeEngine.powerUpToggleTime + SnakeEngine.powerUpDuration)) {
                PickUp.togglePowerUp();
            }
            
            var time = SnakeView.formatTimeStr(SnakeEngine.time);
            $("#clock").text(time);
            
            clearTimeout(this.timer)
            this.timer = setTimeout(SnakeEngine.tick, 1000);
        }
    },
    pause: function () {
        if (SnakeEngine.isOn) {
            SnakeEngine.isOn = false;
            
            if (document.getElementById("powerUpTimeBar")) {
                $("#powerUpTimeBar").stop();
            }
            
            SnakeView.centerElement($("#pauseMenu")).show();
        }
    },
    resume: function () {
        $("#pauseMenu").hide();
        
        // The time remaining on the power-up before the pause.
        if (document.getElementById("powerUpTimeBar")) {
            var powerUpTimeRemain = (SnakeEngine.powerUpToggleTime + SnakeEngine.powerUpDuration) - SnakeEngine.time;
            SnakeView.powerUpTimeBar(powerUpTimeRemain);
        }
        
        SnakeEngine.powerOn();
    }
};
