function Wall(givenTilePos) {
    Cache.walls.push(this);
    
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
                    parentWall = Cache.walls[Math.floor(Math.random() *
                                                        Cache.walls.length)];
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
                    newTilePos[0] > Cache.tilesYLimit ||
                    newTilePos[1] > Cache.tilesXLimit || 
                    Cache.tiles[newTilePos[0]][newTilePos[1]].obj ||
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
    var wall, bombsToCreate = Math.floor(Cache.walls.length * bombsPercent);
    
    Cache.session.gems = Cache.walls.length - bombsToCreate;
    View.updateChallengeInfo(Cache.session.level, Cache.session.gems);
    
    while (bombsToCreate) {
        wall = Cache.walls[Math.floor(Math.random() * Cache.walls.length)];
        if (!wall.hasBomb) {
            wall.hasBomb = true;
            bombsToCreate -= 1;
        }
    }
};

Wall.updateBombHints = function () {
    for (var i = 0, j = Cache.walls.length; i < j; i++) {
        var nearbyBombCount = 0,
            touchingWalls = Helpers.getSurroundingObjs(Cache.walls[i].tilePos,
                                                       Wall);
        
        for (var a = 0, b = touchingWalls.length; a < b; a++) {
            if (touchingWalls[a].hasBomb) {
                nearbyBombCount += 1;
            }
        }
        
        Cache.walls[i].$html.text(nearbyBombCount);
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
        $("#level_" + Cache.session.level).append(this.$html);
    },
    explode: function () {
        var $explosion = $("<div class='explosion'></div>");
        $explosion.css({
            left: Cache.tiles[this.tilePos[0]][this.tilePos[1]].left - 
                  Cache.literals.tileWidth,
            top: Cache.tiles[this.tilePos[0]][this.tilePos[1]].top - 
                 Cache.literals.tileHeight    
        });            
        
        $explosion.appendTo("#level_" + Cache.session.level);
        this.destroy();
        
        setTimeout(function () {
            $explosion.remove();
        }, 200);
    },
    destroy: function (keepHtml) {
        Cache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;
        
        for (var i = 0, j = Cache.walls.length; i < j; i++) {
            if (this === Cache.walls[i]) {
                Cache.walls.splice(i, 1);
            }
        }

        if (!this.hasBomb) {
            Cache.session.gems -= 1;
            View.updateChallengeInfo(Cache.session.level, Cache.session.gems);
            
            if (Cache.session.gems === 0 && Cache.session.difficulty ===
               "challenge") {
                (new PickUp("portal")).create();
            }
        }
        
        if (!keepHtml) {
            this.$html.remove();
        }
    }
};
