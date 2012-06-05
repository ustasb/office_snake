function PickUp(type) {
    SnakeCache.pickUps.push(this);

    this.type = type;
    if (type === "human") {
        this.type = "human";
        SnakeCache.session.humanCount += 1;
    } else if (type === "powerUp") {
        var generateType, pUpType, pUpTypes = ["dblPoints", "shrink", "slowTime", "invincible"];
        
        generateType = function () {
            return pUpTypes[Math.floor(Math.random() * pUpTypes.length)];
        };
        
        pUpType = generateType();
        this.type = (pUpType === "invincible") ? generateType() : pUpType; // Make the invincibility power-up rarer.

        SnakeCache.session.displayedPowerUp = this;
    } else if (type === "portal") {
        this.type = "portal";
    }
    
    this.$html = $("<div class='pickUp " + this.type + "'></div>");
    this.tilePos = [0, 0];
}

PickUp.toggleSmile = function (triggerObj) {
    for (var i = 0, j = SnakeCache.pickUps.length; i < j; i++) {
        if (SnakeCache.pickUps[i].type === "human") {
            var human = SnakeCache.pickUps[i];
            
            if (Math.abs(triggerObj.tilePos[0] - human.tilePos[0]) < 4 &&
                Math.abs(triggerObj.tilePos[1] - human.tilePos[1]) < 4) {
                human.$html.addClass("frown");
            } else {
                human.$html.removeClass("frown");
            }
        }
    }
};

PickUp.togglePowerUp = function () { // Gets called by SnakeEngine.tick() every x seconds.
    if (SnakeCache.session.activePowerUp) {
        SnakeCache.session.activePowerUp.togglePowerUp();
    } else {
        if (SnakeCache.session.displayedPowerUp) {
            SnakeCache.session.displayedPowerUp.destroy();
        } else {
            (new PickUp("powerUp")).create();
        }
        SnakeEngine.powerUpToggleTime = SnakeEngine.time;
    }
};

PickUp.prototype = {
    create: function (givenTilePos) {
        var tilePos = (givenTilePos) ? givenTilePos : SnakeHelpers.findEmptyTile();

        this.tilePos[0] = tilePos[0];
        this.tilePos[1] = tilePos[1];    

        if (this.type === "human") {
            this.$html.addClass("smile");
        } else if (this.type === "powerUp") {
            this.$html.addClass(this.type);
        }
        
        SnakeHelpers.drawObjToTile(this, true);
        $("#level_" + SnakeCache.session.level).append(this.$html);
        return this;
    },
    destroy: function (keepHtml) {
        SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;
        
        if (this.type === "human") {
            SnakeCache.session.humanCount -= 1;
        } else if (this.type !== "portal" && this.type !== "human") { // Refers to a power-up type.
            SnakeCache.session.displayedPowerUp = false;
        }

        for (var i = 0, j = SnakeCache.pickUps.length; i < j; i++) {
            if (this === SnakeCache.pickUps[i]) {
                SnakeCache.pickUps.splice(i, 1);
            }
        }
        
        if (!keepHtml) {
            this.$html.remove();
        }
    },
    togglePowerUp: function () {
        SnakeEngine.powerUpToggleTime = SnakeEngine.time;
        
        if (SnakeCache.session.activePowerUp) {
            SnakeCache.session.activePowerUp = false;
            
            if (this.type !== "shrink") {
                $(".head").removeClass("pickUp " + this.type);
            }
            
            if (document.getElementById("powerUpTimeBar")) {
                $("#powerUpTimeBar").stop();
                $("#powerUpTimeBar").remove();
            }
        } else {
            SnakeCache.session.activePowerUp = this;
            
            if (this.type !== "shrink") {
                $(".head").addClass("pickUp " + this.type);
            }
        }
        
        switch (this.type) {
        case "dblPoints":
            if (SnakeCache.session.activePowerUp) {
                SnakeEngine.activeDblPoints = true;
                SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
            } else {
                SnakeEngine.activeDblPoints = false;
            }
            break;
        case "shrink":
            if (SnakeCache.session.activePowerUp) {
                if (Snake.segsToKill[0]) {
                    Snake.removeDeadSegments();
                }
                if (Snake.segments.length > 3) { // Prevents the power-up from killing the snake.
                    Snake.killSegments(3);
                }
            }
            break;
        case "slowTime":
            if (SnakeCache.session.activePowerUp) {
                Snake.speed *= 2;
                SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
            } else {
                Snake.speed /= 2;
            }
            break;
        case "invincible":
            var speed = (SnakeCache.session.difficulty === "challenge") ? 0.5 : 0.65;
            if (SnakeCache.session.activePowerUp) {
                Snake.invincible = true;
                
                Snake.speed *= speed;
                SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
            } else {
                Snake.invincible = false;
                Snake.speed /= speed;
            }
            break;
        }
    }
};
