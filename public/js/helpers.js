var Helpers = {
    // A tile can be retrieved from Cache.tiles via Cache.tiles[y][x].
    buildTiles: function () {
        // The top starts displaced by 20px to account for the HUD.
        var i = 0, x = 0, y = Cache.literals.tileHeight;
            
        while (x < View.gameContWidth && y < View.gameContHeight) {
            Cache.tiles[i].push({left: x, top: y, obj: undefined});
            x += Cache.literals.tileWidth;
            
            if (x === View.gameContWidth) {
                Cache.tiles.push([]);
                x = 0;
                y += Cache.literals.tileHeight;
                i += 1;
            }
        }
        
        // Positions are zero-based.
        Cache.tilesYLimit = Cache.tiles.length - 2; // -1 for HUD.
        Cache.tilesXLimit = Cache.tiles[0].length - 1;
    },
    findEmptyTile: function () {
        var rndX, rndY;
    
        do {
            rndX = Math.round(Math.random() * Cache.tilesXLimit);
            // +1 to shift all positions below the first row.
            rndY = Math.floor(Math.random() * Cache.tilesYLimit) + 1;
        } while (!Cache.tiles[rndY][rndX] || Cache.tiles[rndY][rndX].obj);

        return [rndY, rndX];
    },
    drawObjToTile: function (obj, updateTileObj, attr) {
        var tile = Cache.tiles[obj.tilePos[0]][obj.tilePos[1]];
        
        if (updateTileObj) {
            tile.obj = obj;
        }
        
        if (attr) {
            obj.$html.css(attr, tile[attr] + "px");
        } else {
            obj.$html.css({
                left: tile.left + "px",
                top: tile.top + "px"
            });
        }
    },
    getSurroundingObjs: function (tilePos, classFilter) {
        var surroundingObjs = [],
            y = tilePos[0] - 1, // The top-left position where the search
            x = tilePos[1] - 1  // starts.
            maxY = y + 3,
            maxX = x + 3;
        
        // Search the 8 surrounding tiles.
        while (y !== maxY && x !== maxX) {
            if (y <= Cache.tilesYLimit &&
                y >= 0 &&
                x >= 0 &&
                x <= Cache.tilesXLimit &&
                (y !== tilePos[0] || x !== tilePos[1]) &&
                Cache.tiles[y][x].obj instanceof (classFilter || Object)) {
                surroundingObjs.push(Cache.tiles[y][x].obj);
            }
            
            y += 1;
            
            if (y === maxY) {
                y -= 3;
                x += 1;
            }
        }
        
        return surroundingObjs;
    },
    getMaxWalls: function () {
        // -40 to account for the HUD and first, neutral row.
        var maxWalls = (View.gameContWidth * (View.gameContHeight - 40)) /
                       (Cache.literals.tileWidth * Cache.literals.tileHeight);
        maxWalls *= 0.40;
        maxWalls -= (maxWalls % 10);
        
        return maxWalls;
    },
    readjustWallSlider: function () {
        var maxWalls, sliderValue;
        
        maxWalls = Helpers.getMaxWalls();
        $("#walls + .slider").slider("option", "max", maxWalls);
        
        sliderValue = maxWalls / 2;
        $("#walls + .slider").slider("option", "value", sliderValue);
        $("#walls").children("span").text(sliderValue);
    },
    nextLevel: function () {
        var priorLevel = Cache.session.level;
        
        if (Cache.session.level === Cache.session.finalLevel) {
            $("#congrats").show();
            View.gameOver();
        } else {
            Cache.session.level += 1;
        
            Engine.isOn = false;
            View.buildLevel();

            // Clear the prior level but keep the HTML so it
            // can slide out of view. 
            Helpers.clearLevel(true); 
            Helpers.prepareLevel(Cache.session.segments,
                                 Cache.session.humansPresent);
            
            $("#levelContainer_" + priorLevel).animate({
                "margin-left" : "-=" + View.gameContWidth + "px"
            }, "slow", function () {
                View.removeLevel(priorLevel);
                Engine.countdown(3);
            });
        }
    },
    retry: function () {
        var sessionDifficulty = Cache.session.difficulty,
            $expiredLevel = $("#levelContainer_" + Cache.session.level);
        
        $expiredLevel.attr("id", "levelContainer_expired");
        $("#level_" + Cache.session.level).attr("id", "level_expired");

        Helpers.clearLevel(true);
        View.resetSession();

        // Reassign the difficulty because resetSession() resets it.
        Cache.session.difficulty = sessionDifficulty;
        
        View.initSession();
        
        $expiredLevel.animate({
            "margin-left" : "-=" + View.gameContWidth + "px"
        }, "slow", function () {
            $("#gameOver").appendTo("#gameViewUtils").hide();
            View.removeLevel("expired");
            Engine.countdown(3);
        });
    },
    prepareLevel: function (segsToCreate, startingHumanCount) {
        var walls, bombs;
        
        Snake.grow(1); // Create the snake's head.
        
        if (Cache.session.difficulty === "challenge") {
            walls = Cache.session.level * Cache.literals.wallMultiplier;
            Snake.segsToCreate = segsToCreate;
        } else if (Cache.session.difficulty === "custom") {
            walls = $("#wallsSlider").slider("value");
            if (walls === 0) {
                $("#snakeHUD .challengeInfo").hide();
            }
            
            // The bomb count is a percentage of the wall count.
            bombs = $("#bombsSlider").slider("value") / 100;
        }
        
        if (walls > 0) {
            Wall.generateWallPattern(walls);
            Wall.plantBombs(bombs);
            Wall.updateBombHints();
        }
        
        for (var i = 0, j = startingHumanCount; i < j; i++) {
            (new PickUp("human")).create();
        }
    },
    clearLevel: function (keepHtml) {
        Engine.isOn = false;
        
        while (Snake.segments[0]) {
            Snake.segments[0].destroy(keepHtml);
        }
        while (Cache.pickUps[0]) {
            Cache.pickUps[0].destroy(keepHtml);
        }
        while (Cache.walls[0]) {
            Cache.walls[0].destroy(keepHtml);
        }
        
        // Disable the active power-up.
        if (Cache.session.activePowerUp) {
            Cache.session.activePowerUp.togglePowerUp();
        }
    },
    enterPortal: function () { // Leads the player to the next level.
        if (Snake.segments.length === 0) {
            Cache.enteringPortal = false;
            Helpers.nextLevel();
        } else {
            Snake.segments[Snake.segments.length - 1].destroy();
            View.updateScore(10);
        }
    }
};
