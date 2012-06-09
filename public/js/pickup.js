function PickUp(type) {
    Cache.pickUps.push(this);

    this.type = type;
    if (type === "human") {
        this.type = "human";
        Cache.session.humanCount += 1;
    } else if (type === "powerUp") {
        var generateType, pUpType,
            pUpTypes = ["dblPoints", "shrink", "slowTime", "invincible"];
        
        generateType = function () {
            return pUpTypes[Math.floor(Math.random() * pUpTypes.length)];
        };
        
        pUpType = generateType();

        // Make the invincibility power-up rarer.
        this.type = (pUpType === "invincible") ? generateType() : pUpType;

        Cache.session.displayedPowerUp = this;
    } else if (type === "portal") {
        this.type = "portal";
    }
    
    this.$html = $("<div class='pickUp " + this.type + "'></div>");
    this.tilePos = [0, 0];
}

PickUp.toggleSmile = function (triggerObj) {
    for (var i = 0, j = Cache.pickUps.length; i < j; i++) {
        if (Cache.pickUps[i].type === "human") {
            var human = Cache.pickUps[i];
            
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
    if (Cache.session.activePowerUp) {
        Cache.session.activePowerUp.togglePowerUp();
    } else {
        if (Cache.session.displayedPowerUp) {
            Cache.session.displayedPowerUp.destroy();
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
        $("#level_" + Cache.session.level).append(this.$html);
        return this;
    },
    destroy: function (keepHtml) {
        Cache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;
        
        if (this.type === "human") {
            Cache.session.humanCount -= 1;
        } else if (this.type !== "portal" && this.type !== "human") {
            Cache.session.displayedPowerUp = false;
        }

        for (var i = 0, j = Cache.pickUps.length; i < j; i++) {
            if (this === Cache.pickUps[i]) {
                Cache.pickUps.splice(i, 1);
            }
        }
        
        if (!keepHtml) {
            this.$html.remove();
        }
    },
    togglePowerUp: function () {
        Engine.powerUpToggleTime = Engine.time;
        
        if (Cache.session.activePowerUp) {
            Cache.session.activePowerUp = false;
            
            if (this.type !== "shrink") {
                $(".head").removeClass("pickUp " + this.type);
            }
            
            if (document.getElementById("powerUpTimeBar")) {
                $("#powerUpTimeBar").stop();
                $("#powerUpTimeBar").remove();
            }
        } else {
            Cache.session.activePowerUp = this;
            
            if (this.type !== "shrink") {
                $(".head").addClass("pickUp " + this.type);
            }
        }
        
        switch (this.type) {
        case "dblPoints":
            if (Cache.session.activePowerUp) {
                Engine.activeDblPoints = true;
                View.powerUpTimeBar(Engine.powerUpDuration);
            } else {
                Engine.activeDblPoints = false;
            }
            break;
        case "shrink":
            if (Cache.session.activePowerUp) {
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
            if (Cache.session.activePowerUp) {
                Snake.speed *= 2;
                View.powerUpTimeBar(Engine.powerUpDuration);
            } else {
                Snake.speed /= 2;
            }
            break;
        case "invincible":
            var speed = (Cache.session.difficulty === "challenge") ? 0.5 :
                                                                     0.65;
            if (Cache.session.activePowerUp) {
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
