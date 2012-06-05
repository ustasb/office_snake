function Wall(givenTilePos) {
    SnakeCache.walls.push(this);
    
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
            newTilePos = SnakeHelpers.findEmptyTile();
            if (!validPos(newTilePos, bannedPosns)) {
                continue;
            }
            if (SnakeHelpers.getSurroundingObjs(newTilePos, Wall).length > 2) {
                bannedPosns.push(newTilePos);
                continue;
            }
        } else {
            freeDirections = allDirections.slice(0); // Make a copy.
        
            do {
                if (freeDirections.length === 0) {
                    bannedPosns.push(parentWall.tilePos);
                    parentWall = SnakeCache.walls[Math.floor(Math.random() * SnakeCache.walls.length)];
                    if (validPos(parentWall.tilePos, bannedPosns)) {
                        freeDirections = allDirections.slice(0);
                    } else {
                        continue;
                    }
                }
                
                currDirection = freeDirections[Math.floor(Math.random() * freeDirections.length)];
                                
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
                    newTilePos[0] > SnakeCache.tilesYLimit ||
                    newTilePos[1] > SnakeCache.tilesXLimit || 
                    SnakeCache.tiles[newTilePos[0]][newTilePos[1]].obj ||
                    SnakeHelpers.getSurroundingObjs(newTilePos, Wall).length > 2) {
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
    var wall, bombsToCreate = Math.floor(SnakeCache.walls.length * bombsPercent);
    
    SnakeCache.session.gems = SnakeCache.walls.length - bombsToCreate;
    SnakeView.updateChallengeInfo(SnakeCache.session.level, SnakeCache.session.gems);
    
    while (bombsToCreate) {
        wall = SnakeCache.walls[Math.floor(Math.random() * SnakeCache.walls.length)];
        if (!wall.hasBomb) {
            wall.hasBomb = true;
            bombsToCreate -= 1;
        }
    }
};

Wall.updateBombHints = function () {
    for (var i = 0, j = SnakeCache.walls.length; i < j; i++) {
        var nearbyBombCount = 0,
            touchingWalls = SnakeHelpers.getSurroundingObjs(SnakeCache.walls[i].tilePos, Wall);
        
        for (var a = 0, b = touchingWalls.length; a < b; a++) {
            if (touchingWalls[a].hasBomb) {
                nearbyBombCount += 1;
            }
        }
        
        SnakeCache.walls[i].$html.text(nearbyBombCount);
    }
};

Wall.updateNeighborWalls = function () { // Update bomb hints and replace island, bomb-occupied walls with a human.
    var nearbyBombCount, touchingWalls, wallTilePos,
        wallsSurroundingHead = SnakeHelpers.getSurroundingObjs(Snake.head.tilePos, Wall);
    
    for (var i = 0, j = wallsSurroundingHead.length; i < j; i++) {
        nearbyBombCount = 0;
        touchingWalls = SnakeHelpers.getSurroundingObjs(wallsSurroundingHead[i].tilePos, Wall);
        
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
        SnakeHelpers.drawObjToTile(this, true);
        $("#level_" + SnakeCache.session.level).append(this.$html);
    },
    explode: function () {
        var $explosion = $("<div class='explosion'></div>");
        $explosion.css({
            left: SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].left - SnakeCache.literals.tileWidth,
            top: SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].top - SnakeCache.literals.tileHeight    
        });            
        
        $explosion.appendTo("#level_" + SnakeCache.session.level);
        this.destroy();
        
        setTimeout(function () {
            $explosion.remove();
        }, 200);
    },
    destroy: function (keepHtml) {
        SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;
        
        for (var i = 0, j = SnakeCache.walls.length; i < j; i++) {
            if (this === SnakeCache.walls[i]) {
                SnakeCache.walls.splice(i, 1);
            }
        }

        if (!this.hasBomb) {
            SnakeCache.session.gems -= 1;
            SnakeView.updateChallengeInfo(SnakeCache.session.level, SnakeCache.session.gems);
            
            if (SnakeCache.session.gems === 0 && SnakeCache.session.difficulty === "challenge") {
                (new PickUp("portal")).create();
            }
        }
        
        if (!keepHtml) {
            this.$html.remove();
        }
    }
};
