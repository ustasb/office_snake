var SnakeView = {
    // Record what the gameContainer's dimensions should be because the browser
    // can't be expected to return accurate measurements when zooming.
    gameContWidth: 0,
    gameContHeight: 0,
    hsRequestTime: 0,
    highScoresView: "classic",
    slidingMenuTab: "homePos",
    slidingMenu: {
        highScoresPos: "",
        homePos: "",
        helpPos: "",
        mapsPos: ""
    },
    initialize: function (width, height) {
        // If JavaScript is enabled, prepare the document.
        if (navigator.platform.indexOf("iPhone") !== -1 || navigator.platform.indexOf("iPod") !== -1) {
            $("#clientWarning").text("Sorry, this site requires a keyboard.");
        } else if ($.browser && $.browser.msie && $.browser.version <= 6.0) {
            $("#clientWarning").html("Your browser isn't supported here.<br />Update it!");
        } else {
            $("#clientWarning").remove();
            $("#pauseMenu, #gameOver, .ui-resizable-handle").hide();
            $("#source a").text("source v" + Snake.version);
            $("#gameContainer, #source, #credit").show();
            
            // Sanitize arguments
            width = (width > 500) ? width : 500;
            width -= (width % SnakeCache.literals.tileWidth);
            height = (height > 500) ? height : 500;
            height -= (height % SnakeCache.literals.tileHeight);
            
            SnakeView.updateGameContainer(width, height);
            SnakeView.updateViewDependencies(width, height);
            
            var maxWidth = $(window).width() / 1.3,
                maxHeight = $(window).height() / 1.3;            
            
            maxWidth -= (maxWidth % SnakeCache.literals.tileWidth);
            maxHeight -= (maxHeight % SnakeCache.literals.tileHeight);
            
            maxWidth = (maxWidth > width) ? maxWidth : width + 100;
            maxHeight = (maxHeight > height) ? maxHeight : height + 100;
            maxWidth = (maxWidth < 1500) ? maxWidth : 1500;
            maxHeight = (maxHeight < 1100) ? maxHeight : 1100;                

            $("#gameContainer").resizable("option", {
                maxWidth: maxWidth,
                maxHeight: maxHeight
            });
        }
    },
    loadHighScores: function (difficulty) {
        var currentTime = (new Date()).getTime();
        
        // Prevents the user from overloading the server with requests.
        if (currentTime - SnakeView.hsRequestTime > 250) {
            var scorePadding, scoresToLoad, handleSuccess;
            
            SnakeView.hsRequestTime = (new Date()).getTime();
            
            scorePadding = 4 * SnakeCache.literals.tileHeight;
            scoresToLoad = Math.floor((SnakeView.gameContHeight - scorePadding) / SnakeCache.literals.tileHeight);
            
            $("#" + difficulty + "View").css("text-decoration", "underline")
            .siblings().css("text-decoration", "none");
            
            if (!document.getElementById("loading")) {
                $("#canvas").append('<div id="loading">Loading...</div>');
            }
            
            handleSuccess = function(csvResponse) {
                var $csvRow, time, rank = 1;

                if (typeof csvResponse === "string") {
                    csvResponse = csvResponse.split("\n");
                    csvResponse.pop(); // Destroy the last index that's created by the trailing '\n'.
                }
                
                $(".highscore, #loading").remove();
                
                for (var i = 0, j = csvResponse.length; i < j; i++) {
                    csvResponse[i] = csvResponse[i].split(",");
                    time = SnakeView.formatTimeStr(csvResponse[i][2]);
                    if (time.length < 3) {
                        time += "s";
                    }
                    
                    // This concatenation needs work...
                    $csvRow = $("<tr class='highscore'><td>" + rank + "</td><td>" + csvResponse[i][0] + "</td>" +
                        "<td>" + csvResponse[i][1] + "</td><td>" + time + "</td><td>" + csvResponse[i][3] + "</td></tr>");
                    $("#highScores table").append($csvRow);
                    
                    rank += 1;
                }
            };

            if (HighScores) {
                HighScores.get(scoresToLoad, difficulty, handleSuccess)
            }
        }
    },
    alignMenuTabs: function (width) { // Sets the 'left' positions of the sliding menu tabs.
        var posLeft, posIncrement = 0;
        
        for (posLeft in SnakeView.slidingMenu) {
            if (SnakeView.slidingMenu.hasOwnProperty(posLeft)) {
                SnakeView.slidingMenu[posLeft] = posIncrement;
                posIncrement -= width;
            }
        }
    },
    formatTimeStr: function (seconds) {
        var minutes;
        
        if (seconds / 60 >= 1) {
            minutes = Math.floor(seconds / 60);
            seconds -= (minutes * 60);
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            return minutes + ":" + seconds;
        } else {
            return seconds;
        }    
    },
    animateMenu: function (menuTab, callback) {
        SnakeView.slidingMenuTab = menuTab;
        
        $("#slidingMenu").animate({
            "left" : SnakeView.slidingMenu[menuTab] + "px"
        }, {
            duration: "slow",
            queue: false,
            complete: callback
        });
    },
    alignGameWinToGrid: function (tileWidth, tileHeight) {
        var validWidth = SnakeView.gameContWidth,
            validHeight = SnakeView.gameContHeight;
        
        validWidth -= SnakeView.gameContWidth % tileWidth;
        validHeight -= SnakeView.gameContHeight % tileHeight;
        
        SnakeView.updateGameContainer(validWidth, validHeight);
        SnakeView.updateViewDependencies(validWidth, validHeight);
    },
    centerElement: function ($element, $parent) {
        var topPad, attr;
        
        $parent = $parent || $("#gameContainer");
        attr = ($element.css("position") === "static") ? "marginTop" : "top";
        topPad = ($parent.height() - $element.outerHeight()) / 2;

        $element.css(attr, topPad + "px");

        return $element;
    },
    updateChallengeInfo: function (level, gems) {
        var progress = "Hidden Humans: " + gems;
        
        if (SnakeCache.session.difficulty === "challenge") {
            progress = "Level: " + level + " | " + progress;
        }
        
        $("#snakeHUD .challengeInfo").text(progress);
    },
    updateGameContainer: function (width, height) {
        var top = ($(document).height() - height) / 2;
                
        $("#gameContainer").css("top", top + "px")
        .width(width)
        .height(height);

        SnakeView.gameContWidth = width;
        SnakeView.gameContHeight = height;
    },
    updateViewDependencies: function (width, height) {
        if (width) {
            $("#canvas, #highScores, #home, #help, #maps .levelContainer, #gameViewUtils").width(width);
            
            SnakeView.alignMenuTabs(width);
            $("#slidingMenu").css("left", SnakeView.slidingMenu[SnakeView.slidingMenuTab] + "px");
        }
        
        if (height) {
            $("#canvas, #slidingMenu").height(height);
        }
        
        $(".centerBox").each(function () {
            SnakeView.centerElement($(this));
        });
    },
    selectDifficulty: function (difficulty) {
        SnakeCache.session.difficulty = difficulty;
        $("#selectedDifficulty").text("difficulty: " + difficulty);
        
        if (difficulty === "custom") {
            $(".challengeInfo, #instructions, #pickUpCtrlInfo").hide();
            $("#custom, #snakeHUD .challengeInfo").show();
            
            SnakeView.centerElement($("#help .centerBox"));
            SnakeHelpers.readjustWallSlider();
        } else {
            $("#custom").hide();
            $("#instructions, #pickUpCtrlInfo").show();

            if (difficulty === "classic") {
                $(".challengeInfo").hide();
            } else {
                $(".challengeInfo").show();
            }
            
            var topPad = ($(document).height() - SnakeCache.literals.compHeight) / 2;
            
            $("#gameContainer").animate({
                width : SnakeCache.literals.compWidth + "px",
                height: SnakeCache.literals.compHeight + "px",
                top: topPad + "px"
            }, {
                duration: "slow",
                queue: false,
                step: function (now, fx) {
                    if (fx.prop === "width") {
                        SnakeView.gameContWidth = now;
                        SnakeView.updateViewDependencies(now);
                    } else if (fx.prop === "height") {
                        SnakeView.gameContHeight = now;
                        SnakeView.updateViewDependencies(false, now);
                    }
                }
            });
            
            SnakeView.alignMenuTabs(SnakeCache.literals.compWidth);
        }
        
        SnakeView.animateMenu("helpPos");
    },
    updateScore: function (points) {
        points = (SnakeEngine.activeDblPoints) ? points * 2 : points;
        SnakeCache.session.score += points;
        
        $("#scoreBar").text(SnakeCache.session.score + "pts");

        points = (points > 0) ? "+" + points : points;
        $("#pointAddition").html("<span>" + points + "pts<span>");
        
        if (SnakeCache.addedPtsTimer) {
            clearTimeout(SnakeCache.addedPtsTimer);
        }
        
        SnakeCache.addedPtsTimer = setTimeout(function () {
            if ($.browser && $.browser.msie && $.browser.version < 9.0) {
                // This is an IE < 9 fix. Firstly, fadeout() is too processor intensive for IE and slows the game down noticeably.
                // It is, however, a desirable effect for faster browsers.
                // Finally, removing the span isn't immediate--the span hangs around like an artifact before disappearing. It perplexes me.
                // The solution is to replace the span with a non-breaking-space.
                $("#pointAddition").html("&nbsp;");
            } else {
                $("#pointAddition span").fadeOut();
            }
        }, 1000);
    },
    buildLevel: function () {
        $('<div id="levelContainer_' + SnakeCache.session.level + '" class="levelContainer"></div>')
        .width(SnakeView.gameContWidth)
        .append('<div id="level_' + SnakeCache.session.level + '" class="level"><div id="countdown"><div>3</div></div></div>')
        .appendTo("#mapsIE7Fix");
        
        if (SnakeCache.session.difficulty === "challenge") {
            $("#countdown").prepend("<div id='currentLevel'>Level " + SnakeCache.session.level + "</div>");
        } else {
            SnakeView.centerElement($("#countdown div"), $("#countdown"));
        }
        
        SnakeView.centerElement($("#countdown"));
    },
    powerUpTimeBar: function (time) {
        time *= 1000; // Convert to milliseconds.
    
        if (!document.getElementById("powerUpTimeBar")) {
            $("<div id='powerUpTimeBar'></div>").appendTo("#powerUpPlaceHolder");
        }
        
        $("#powerUpTimeBar").animate({
            width: "0px"
        }, time, function () {
            $(this).remove();
        });
    },
    initSession: function () {
        if (SnakeCache.session.difficulty !== "custom") {
            Snake.segsToCreate = Snake.initSegs;
            SnakeEngine.powerUpDuration = 5;
        }
        
        switch (SnakeCache.session.difficulty) {
        case "classic":
            Snake.speed = 76;
            SnakeCache.session.humansPresent = 3;
            break;
        case "challenge":
            Snake.speed = 120;
            SnakeCache.session.humansPresent = 0;
            
            // Determine the final level based on the level size.
            var maxWalls = SnakeHelpers.getMaxWalls();
            SnakeCache.session.finalLevel = maxWalls / SnakeCache.literals.wallMultiplier;
            break;
        case "custom":
            // -1 because the snake's head is always generated.
            Snake.segsToCreate = $("#startingLengthSlider").slider("value") - 1;
            SnakeCache.session.humansPresent = $("#humansPresentSlider").slider("value");
            SnakeEngine.powerUpDuration = $("#powerUpDurationSlider").slider("value");
            // Convert the speed to appropriate milliseconds.
            Snake.speed = ($("#speedSlider").slider("option", "max") - $("#speedSlider").slider("value")) * 10 + 20;
            break;
        }
        
        SnakeHelpers.buildTiles();
        SnakeView.buildLevel();
        SnakeHelpers.prepareLevel(Snake.initSegs, SnakeCache.session.humansPresent);
    },
    resetSession: function () {
        SnakeCache.resetCache();
        
        SnakeEngine.powerUpToggleTime = 0;
        
        $("#pauseMenu").hide();
        $("#clock").text(SnakeEngine.time = 0);
        $("#scoreBar").text(SnakeCache.session.score + "pts");
    },
    gameOver: function () {
        if (document.getElementById("powerUpTimeBar")) {
            $("#powerUpTimeBar").stop();
        }
        
        $("#score").text("Score: " + SnakeCache.session.score);
        $("#rank").text("Rank: -");
        
        if (SnakeCache.session.difficulty === "custom") {
            $("#rank, #enterName").hide();
        } else {
            if (SnakeCache.session.score >= 100) {
                $("input[name='name']").val("").removeAttr("disabled");
                $("#enterName span:last-child").attr("id", "submit").text("Submit");
                $("#rank, #enterName").show();
            } else {
                $("#rank, #enterName").hide();
            }
        }
        
        $("#gameOver").appendTo("#level_" + SnakeCache.session.level).width(SnakeView.gameContWidth);
        $("#gameOver").show();
        SnakeView.centerElement($("#gameOver"));
        $("#enterName input").focus();
    },
    removeLevel: function (level) {
        $("#levelContainer_" + level || SnakeCache.session.level).remove();
    }
};
