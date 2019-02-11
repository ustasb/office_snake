function Wall(givenTilePos) {
    State.walls.push(this);

    this.$html = $("<div class='wall'></div>");
    this.tilePos = givenTilePos;
    this.hasBomb = false;
    this.direction = undefined;
}

Wall.generateWallPattern = function (wallsToCreate) {
    var parentWall, freeDirections, currDirection, newTilePos, validPos,
        seed = 4, i = 0, allDirections = [1, 2, 3, 4], bannedPosns = [];

    // Prevents bad positions from being tested multiple times.
    validPos = function (pos, badPosns) {
        for (var i = 0, j = badPosns.length; i < j; i++) {
            if (pos === badPosns[i]) {
                return false;
            }
        }
        return true;
    };

    while (i < wallsToCreate) {

        if (i % seed === 0) {
            newTilePos = Helpers.findEmptyTile();
            if (!validPos(newTilePos, bannedPosns)) {
                continue;
            }
            if (Helpers.getSurroundingObjs(newTilePos, Wall).length > 2) {
                bannedPosns.push(newTilePos);
                continue;
            }
        } else {
            freeDirections = allDirections.slice(0); // Make a copy.

            do {
                if (freeDirections.length === 0) {
                    bannedPosns.push(parentWall.tilePos);
                    parentWall = State.walls[Math.floor(Math.random() *
                                                        State.walls.length)];
                    if (validPos(parentWall.tilePos, bannedPosns)) {
                        freeDirections = allDirections.slice(0);
                    } else {
                        continue;
                    }
                }

                currDirection = freeDirections[Math.floor(Math.random() *
                                                          freeDirections.length)];

                newTilePos = parentWall.tilePos.slice(0);
                switch (currDirection) {
                case 1: // North
                    newTilePos[0] -= 1;
                    break;
                case 2: // East
                    newTilePos[1] += 1;
                    break;
                case 3: // South
                    newTilePos[0] += 1;
                    break;
                case 4: // West
                    newTilePos[1] -= 1;
                    break;
                }

                if (newTilePos[0] < 1 ||
                    newTilePos[1] < 0 ||
                    newTilePos[0] > State.tilesYLimit ||
                    newTilePos[1] > State.tilesXLimit ||
                    State.tiles[newTilePos[0]][newTilePos[1]].obj ||
                    Helpers.getSurroundingObjs(newTilePos, Wall).length > 2) {
                    bannedPosns.push(newTilePos);
                    newTilePos = false;
                    for (var a = 0, b = freeDirections.length; a < b; a++) {
                        if (currDirection === freeDirections[a]) {
                            freeDirections.splice(a, 1);
                        }
                    }
                }

            } while (!newTilePos);
        }

        parentWall = new Wall(newTilePos);
        parentWall.build();
        i += 1;
    }

};

Wall.plantBombs = function (bombsPercent) {
    bombsPercent = (bombsPercent || bombsPercent === 0) ? bombsPercent : 0.5;
    var wall, bombsToCreate = Math.floor(State.walls.length * bombsPercent);

    State.session.gems = State.walls.length - bombsToCreate;
    View.updateChallengeInfo(State.session.level, State.session.gems);

    while (bombsToCreate) {
        wall = State.walls[Math.floor(Math.random() * State.walls.length)];
        if (!wall.hasBomb) {
            wall.hasBomb = true;
            bombsToCreate -= 1;
        }
    }
};

Wall.updateBombHints = function () {
    for (var i = 0, j = State.walls.length; i < j; i++) {
        var nearbyBombCount = 0,
            touchingWalls = Helpers.getSurroundingObjs(State.walls[i].tilePos,
                                                       Wall);

        for (var a = 0, b = touchingWalls.length; a < b; a++) {
            if (touchingWalls[a].hasBomb) {
                nearbyBombCount += 1;
            }
        }

        State.walls[i].$html.text(nearbyBombCount);
    }
};

// Update bomb hints and replace island, bomb-occupied walls with a human.
Wall.updateNeighborWalls = function () {
    var nearbyBombCount, touchingWalls, wallTilePos,
        wallsSurroundingHead = Helpers.getSurroundingObjs(Snake.head.tilePos,
                                                          Wall);

    for (var i = 0, j = wallsSurroundingHead.length; i < j; i++) {
        nearbyBombCount = 0;
        touchingWalls = Helpers.getSurroundingObjs(wallsSurroundingHead[i].tilePos,
                                                   Wall);

        if (touchingWalls.length === 0 && wallsSurroundingHead[i].hasBomb) {
            wallTilePos = wallsSurroundingHead[i].tilePos;

            wallsSurroundingHead[i].explode();

            (new PickUp("human")).create(wallTilePos);
        } else {
            for (var a = 0, b = touchingWalls.length; a < b; a++) {
                if (touchingWalls[a].hasBomb) {
                    nearbyBombCount += 1;
                }
            }
            wallsSurroundingHead[i].$html.text(nearbyBombCount);
        }
    }
};

Wall.prototype = {
    build: function () {
        Helpers.drawObjToTile(this, true);
        $("#level_" + State.session.level).append(this.$html);
    },
    explode: function () {
        var $explosion = $("<div class='explosion'></div>");
        $explosion.css({
            left: State.tiles[this.tilePos[0]][this.tilePos[1]].left -
                  State.literals.tileWidth,
            top: State.tiles[this.tilePos[0]][this.tilePos[1]].top -
                 State.literals.tileHeight
        });

        $explosion.appendTo("#level_" + State.session.level);
        this.destroy();

        setTimeout(function () {
            $explosion.remove();
        }, 200);
    },
    destroy: function (keepHtml) {
        State.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;

        for (var i = 0, j = State.walls.length; i < j; i++) {
            if (this === State.walls[i]) {
                State.walls.splice(i, 1);
            }
        }

        if (!this.hasBomb) {
            State.session.gems -= 1;
            View.updateChallengeInfo(State.session.level, State.session.gems);

            if (State.session.gems === 0 && State.session.difficulty ===
               "challenge") {
                (new PickUp("portal")).create();
            }
        }

        if (!keepHtml) {
            this.$html.remove();
        }
    }
};
