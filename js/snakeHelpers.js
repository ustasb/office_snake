var SnakeHelpers = {
    // A tile can be retrieved from SnakeCache.tiles via SnakeCache.tiles[y][x].
    buildTiles: function () {
        // The top starts displaced by 20px to account for the HUD.
        var i = 0, x = 0, y = SnakeCache.literals.tileHeight;
            
        while (x < SnakeView.gameContWidth && y < SnakeView.gameContHeight) {
            SnakeCache.tiles[i].push({left: x, top: y, obj: undefined});
            x += SnakeCache.literals.tileWidth;
            
            if (x === SnakeView.gameContWidth) {
                SnakeCache.tiles.push([]);
                x = 0;
                y += SnakeCache.literals.tileHeight;
                i += 1;
            }
        }
        
        // Positions are zero-based thus subtract 1 from the length.
        SnakeCache.tilesYLimit = SnakeCache.tiles.length - 2;
        SnakeCache.tilesXLimit = SnakeCache.tiles[0].length - 1;
    },
    findEmptyTile: function () {
        var rndX, rndY;
    
        do {
            rndX = Math.round(Math.random() * SnakeCache.tilesXLimit);
            // +1 to shift all positions below the first row.
            rndY = Math.floor(Math.random() * SnakeCache.tilesYLimit) + 1;
        } while (!SnakeCache.tiles[rndY][rndX] || SnakeCache.tiles[rndY][rndX].obj);

        return [rndY, rndX];
    },
    drawObjToTile: function (obj, updateTileObj, attr) {
        var tile = SnakeCache.tiles[obj.tilePos[0]][obj.tilePos[1]];
        
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
            y = tilePos[0] - 1, // The top-left position where the search starts.
            x = tilePos[1] - 1, // ^^
            maxY = y + 3,
            maxX = x + 3;
        
        // Search the 8 surrounding tiles.
        while (y !== maxY && x !== maxX) {
            if (y <= SnakeCache.tilesYLimit &&
                y >= 0 &&
                x >= 0 &&
                x <= SnakeCache.tilesXLimit &&
                (y !== tilePos[0] || x !== tilePos[1]) &&
                SnakeCache.tiles[y][x].obj instanceof (classFilter || Object)) {
                surroundingObjs.push(SnakeCache.tiles[y][x].obj);
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
        var maxWalls = (SnakeView.gameContWidth * (SnakeView.gameContHeight - 40)) /
                (SnakeCache.literals.tileWidth * SnakeCache.literals.tileHeight);
        maxWalls *= 0.40;
        maxWalls -= (maxWalls % 10);
        
        return maxWalls;
    },
    readjustWallSlider: function () {
        var maxWalls, sliderValue;
        
        maxWalls = SnakeHelpers.getMaxWalls();
        $("#walls + .slider").slider("option", "max", maxWalls);
        
        sliderValue = maxWalls / 2;
        $("#walls + .slider").slider("option", "value", sliderValue);
        $("#walls").children("span").text(sliderValue);
    },
    nextLevel: function () {
        var priorLevel = SnakeCache.session.level;
        
        if (SnakeCache.session.level === SnakeCache.session.finalLevel) {
            $("#congrats").show();
            SnakeView.gameOver();
        } else {
            SnakeCache.session.level += 1;
        
            SnakeEngine.isOn = false;
            SnakeView.buildLevel();
            SnakeHelpers.clearLevel(true); // Clear the prior level but keep the HTML so it can slide out of view.
            SnakeHelpers.prepareLevel(SnakeCache.session.segments, SnakeCache.session.humansPresent);
            
            $("#levelContainer_" + priorLevel).animate({
                "margin-left" : "-=" + SnakeView.gameContWidth + "px"
            }, "slow", function () {
                SnakeView.removeLevel(priorLevel);
                SnakeEngine.countdown(3);
            });
        }
    },
    retry: function () {
        var sessionDifficulty = SnakeCache.session.difficulty,
            $expiredLevel = $("#levelContainer_" + SnakeCache.session.level);
        
        $expiredLevel.attr("id", "levelContainer_expired");
        $("#level_" + SnakeCache.session.level).attr("id", "level_expired");

        SnakeHelpers.clearLevel(true);
        SnakeView.resetSession();
        SnakeCache.session.difficulty = sessionDifficulty; // Reassign the difficulty because resetSession() resets it.
        
        SnakeView.initSession();
        
        $expiredLevel.animate({
            "margin-left" : "-=" + SnakeView.gameContWidth + "px"
        }, "slow", function () {
            $("#gameOver").appendTo("#gameViewUtils").hide();
            SnakeView.removeLevel("expired");
            SnakeEngine.countdown(3);
        });
    },
    prepareLevel: function (segsToCreate, startingHumanCount) {
        var walls, bombs;
        
        Snake.grow(1); // Create the snake's head.
        
        if (SnakeCache.session.difficulty === "challenge") {
            walls = SnakeCache.session.level * SnakeCache.literals.wallMultiplier;
            Snake.segsToCreate = segsToCreate;
        } else if (SnakeCache.session.difficulty === "custom") {
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
        SnakeEngine.isOn = false;
        
        while (Snake.segments[0]) {
            Snake.segments[0].destroy(keepHtml);
        }
        while (SnakeCache.pickUps[0]) {
            SnakeCache.pickUps[0].destroy(keepHtml);
        }
        while (SnakeCache.walls[0]) {
            SnakeCache.walls[0].destroy(keepHtml);
        }
        
        // Disable the active power-up.
        if (SnakeCache.session.activePowerUp) {
            SnakeCache.session.activePowerUp.togglePowerUp();
        }
    },
    enterPortal: function () { // Leads the player to the next level.
        if (Snake.segments.length === 0) {
            SnakeCache.enteringPortal = false;
            SnakeHelpers.nextLevel();
        } else {
            Snake.segments[Snake.segments.length - 1].destroy();
            SnakeView.updateScore(10);
        }
    }
};
