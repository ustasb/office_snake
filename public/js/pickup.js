function PickUp(type) {
    State.pickUps.push(this);

    this.type = type;
    if (type === "human") {
        this.type = "human";
        State.session.humanCount += 1;
    } else if (type === "powerUp") {
        this.type = PickUp.generateType();

        // Make the invincibility power-up rarer.
        this.type = (this.type === "invincible") ? PickUp.generateType() :
                                                   this.type;

        State.session.displayedPowerUp = this;
    } else if (type === "portal") {
        this.type = "portal";
    }

    this.$html = $("<div class='pickUp " + this.type + "'></div>");
    this.tilePos = [0, 0];
}

PickUp.generateType = function () {
    var pickUps = ["dblPoints", "shrink", "slowTime", "invincible"];
    return pickUps[Math.floor(Math.random() * pickUps.length)];
};

PickUp.toggleSmile = function (triggerObj) {
    for (var i = 0, j = State.pickUps.length; i < j; i++) {
        if (State.pickUps[i].type === "human") {
            var human = State.pickUps[i];

            if (Math.abs(triggerObj.tilePos[0] - human.tilePos[0]) < 4 &&
                Math.abs(triggerObj.tilePos[1] - human.tilePos[1]) < 4) {
                human.$html.addClass("frown");
            } else {
                human.$html.removeClass("frown");
            }
        }
    }
};

PickUp.togglePowerUp = function () {
    if (State.session.activePowerUp) {
        State.session.activePowerUp.togglePowerUp();
    } else {
        if (State.session.displayedPowerUp) {
            State.session.displayedPowerUp.destroy();
        } else {
            (new PickUp("powerUp")).create();
        }
        Engine.powerUpToggleTime = Engine.time;
    }
};

PickUp.prototype = {
    create: function (givenTilePos) {
        var tilePos = (givenTilePos) ? givenTilePos : Helpers.findEmptyTile();

        this.tilePos[0] = tilePos[0];
        this.tilePos[1] = tilePos[1];

        if (this.type === "human") {
            this.$html.addClass("smile");
        } else if (this.type === "powerUp") {
            this.$html.addClass(this.type);
        }

        Helpers.drawObjToTile(this, true);
        $("#level_" + State.session.level).append(this.$html);
        return this;
    },
    destroy: function (keepHtml) {
        State.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;

        if (this.type === "human") {
            State.session.humanCount -= 1;
        } else if (this.type !== "portal" && this.type !== "human") {
            State.session.displayedPowerUp = false;
        }

        for (var i = 0, j = State.pickUps.length; i < j; i++) {
            if (this === State.pickUps[i]) {
                State.pickUps.splice(i, 1);
            }
        }

        if (!keepHtml) {
            this.$html.remove();
        }
    },
    togglePowerUp: function () {
        Engine.powerUpToggleTime = Engine.time;

        if (State.session.activePowerUp) {
            State.session.activePowerUp = false;

            if (this.type !== "shrink") {
                $(".head").removeClass("pickUp " + this.type);
            }

            if (document.getElementById("powerUpTimeBar")) {
                $("#powerUpTimeBar").stop();
                $("#powerUpTimeBar").remove();
            }
        } else {
            State.session.activePowerUp = this;

            if (this.type !== "shrink") {
                $(".head").addClass("pickUp " + this.type);
            }
        }

        switch (this.type) {
        case "dblPoints":
            if (State.session.activePowerUp) {
                Engine.activeDblPoints = true;
                View.powerUpTimeBar(Engine.powerUpDuration);
            } else {
                Engine.activeDblPoints = false;
            }
            break;
        case "shrink":
            if (State.session.activePowerUp) {
                if (Snake.segsToKill[0]) {
                    Snake.removeDeadSegments();
                }

                // Prevents the power-up from killing the snake.
                if (Snake.segments.length > 3) {
                    Snake.killSegments(3);
                }
            }
            break;
        case "slowTime":
            if (State.session.activePowerUp) {
                Snake.speed *= 2;
                View.powerUpTimeBar(Engine.powerUpDuration);
            } else {
                Snake.speed /= 2;
            }
            break;
        case "invincible":
            var speed = (State.session.difficulty === "challenge") ? 0.5 :
                                                                     0.65;
            if (State.session.activePowerUp) {
                Snake.invincible = true;

                Snake.speed *= speed;
                View.powerUpTimeBar(Engine.powerUpDuration);
            } else {
                Snake.invincible = false;
                Snake.speed /= speed;
            }
            break;
        }
    }
};
