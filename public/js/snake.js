var Snake = {
    head: undefined,
    initSegs: 6,
    segsToCreate: 0,
    segsToKill: [0, 0], // [Segments to kill, Time when to remove the segments]
    invincible: false,
    speed: undefined,
    segments: [],
    grow: function (segments) {
        for (var i = 0; i < segments; i++) {
            (new SnakeSegment()).create();
        }
    },
    move: function () {
        var segment, headTile, hitObj;

        for (var i = 0, j = Snake.segments.length; i < j; i++) {
            segment = Snake.segments[i];

            if (i === 0) {
                segment.moveHead();
            } else {
                segment.follow();
            }

            // Empty the last segment's previous tile of any objects.
            if (i === j - 1) {
                var prevTile = segment.previousTilePos;
                State.tiles[prevTile[0]][prevTile[1]].obj = undefined;
            }
        }

        headTile = State.tiles[Snake.head.tilePos[0]][Snake.head.tilePos[1]];
        hitObj = headTile.obj;
        headTile.obj = Snake.head;

        return hitObj;
    },
    animate: function () {
        var hitObj = Snake.move();

        if (hitObj) {
            if (hitObj instanceof PickUp) {
                Snake.eat(hitObj);
            } else if (hitObj instanceof Wall) {
                if (!Snake.collide(hitObj)) {
                    return false;
                }
            } else if (hitObj instanceof SnakeSegment && !Snake.invincible &&
                       !hitObj.$html.hasClass("deadSnakeSeg")) {
                return false;
            }
        }

        return true; // The snake has survived.
    },
    eat: function (matchedItem) {
        if (matchedItem.type === "human") {
            View.updateScore(10);

            Snake.segsToCreate += 1;

            if (State.session.humanCount <= State.session.humansPresent) {
                (new PickUp("human")).create();
            }
        } else if (matchedItem.type === "portal") {
            State.session.segments = Snake.segments.length;

            // Create the illusion that the snake has entered the portal.
            Snake.head.$html.css("backgroundColor", "#afafaf");
            if (State.session.activePowerUp &&
                State.session.activePowerUp.type !== "shrink") {
                $(".head").removeClass("pickUp " +
                                       State.session.activePowerUp.type);
            }

            State.enteringPortal = true;
        } else { // Must be a power-up.
            matchedItem.togglePowerUp();
        }

        matchedItem.destroy();
    },
    collide: function (hitWall) {
        var wallPoints = 30;

        if (hitWall.hasBomb && !Snake.invincible) {
            wallPoints = -50;

            hitWall.explode();

            if (!Snake.killSegments(4)) {
                return false;
            }
        } else {
            hitWall.destroy();
            Snake.segsToCreate += 1;
        }
        View.updateScore(wallPoints);
        Wall.updateNeighborWalls();

        return true; // The snake is still alive.
    },
    // Highlights the dead segments red.
    killSegments: function (segsToKill, time, preserveExisting) {
        var tempSeg;

        if (!preserveExisting && Snake.segsToKill[0] > 0) {
            // Remove any segments already waiting for removal.
            Snake.removeDeadSegments();
        }

        Snake.segsToKill[0] = segsToKill;
        Snake.segsToKill[1] = time || (Engine.time + 1);

        for (var i = 1; i <= segsToKill; i++) {
            tempSeg = Snake.segments[Snake.segments.length - i];

            if (tempSeg) {
                tempSeg.$html.addClass("deadSnakeSeg");
            } else {
                return false;
            }
        }

        if (segsToKill >= Snake.segments.length) {
            return false; // The snake has died.
        }

        return true;
    },
    removeDeadSegments: function () {
        var lastObj;

        while (Snake.segsToKill[0]) {
            Snake.segments[Snake.segments.length - 1].destroy();
            Snake.segsToKill[0] -= 1;
        }

        lastObj = Snake.segments[Snake.segments.length - 1];
        State.tiles[lastObj.tilePos[0]][lastObj.tilePos[1]].obj = undefined;
    }
};
