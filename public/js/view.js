var View = {
    // Record what the gameContainer's dimensions should be because the 
    // browser can't be expected to return accurate measurements when zooming.
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
        if (navigator.platform.indexOf("iPhone") !== -1 ||
            navigator.platform.indexOf("iPod") !== -1) {
            $("#clientWarning").text("Sorry, this site requires a keyboard.");
        } else if ($.browser && $.browser.msie && $.browser.version <= 6.0) {
            $("#clientWarning").html("Your browser isn't supported" + 
                                     "here.<br />Update it!");
        } else {
            $("#clientWarning").remove();
            $("#pauseMenu, #gameOver, .ui-resizable-handle").hide();
            $("#source a").text("source v" + Snake.version);
            $("#gameContainer, #source, #credit").show();
            
            // Sanitize arguments
            width = (width > 500) ? width : 500;
            width -= (width % Cache.literals.tileWidth);
            height = (height > 500) ? height : 500;
            height -= (height % Cache.literals.tileHeight);
            
            View.updateGameContainer(width, height);
            View.updateViewDependencies(width, height);
            
            var maxWidth = $(window).width() / 1.3,
                maxHeight = $(window).height() / 1.3;            
            
            maxWidth -= (maxWidth % Cache.literals.tileWidth);
            maxHeight -= (maxHeight % Cache.literals.tileHeight);
            
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
        if (currentTime - View.hsRequestTime > 250) {
            var scorePadding, scoresToLoad, handleSuccess;
            
            View.hsRequestTime = (new Date()).getTime();
            
            scorePadding = 4 * Cache.literals.tileHeight;
            scoresToLoad = Math.floor((View.gameContHeight - scorePadding) /
                                      Cache.literals.tileHeight);
            
            $("#" + difficulty + "View").css("text-decoration", "underline")
            .siblings().css("text-decoration", "none");
            
            if (!document.getElementById("loading")) {
                $("#canvas").append('<div id="loading">Loading...</div>');
            }
            
            handleSuccess = function(csvResponse) {
                var $csvRow, time, rank = 1;

                if (typeof csvResponse === "string") {
                    csvResponse = csvResponse.split("\n");
                    // Destroy the last index that's created by the
                    // trailing '\n'.
                    csvResponse.pop();
                }
                
                $(".highscore, #loading").remove();
                
                for (var i = 0, j = csvResponse.length; i < j; i++) {
                    csvResponse[i] = csvResponse[i].split(",");
                    time = View.formatTimeStr(csvResponse[i][2]);
                    if (time.length < 3) {
                        time += "s";
                    }
                    
                    $csvRow = $("<tr class='highscore'><td>" + rank +
                                "</td><td>" + csvResponse[i][0] + "</td>" +
                                "<td>" + csvResponse[i][1] + "</td><td>" +
                                time + "</td><td>" + csvResponse[i][3] + 
                                "</td></tr>");

                    $("#highScores table").append($csvRow);
                    
                    rank += 1;
                }
            };

            if (HighScores) {
                HighScores.get(scoresToLoad, difficulty, handleSuccess)
            }
        }
    },
    // Sets the 'left' positions of the sliding menu tabs.
    alignMenuTabs: function (width) {
        var posLeft, posIncrement = 0;
        
        for (posLeft in View.slidingMenu) {
            if (View.slidingMenu.hasOwnProperty(posLeft)) {
                View.slidingMenu[posLeft] = posIncrement;
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
        View.slidingMenuTab = menuTab;
        
        $("#slidingMenu").animate({
            "left" : View.slidingMenu[menuTab] + "px"
        }, {
            duration: "slow",
            queue: false,
            complete: callback
        });
    },
    alignGameWinToGrid: function (tileWidth, tileHeight) {
        var validWidth = View.gameContWidth,
            validHeight = View.gameContHeight;
        
        validWidth -= View.gameContWidth % tileWidth;
        validHeight -= View.gameContHeight % tileHeight;
        
        View.updateGameContainer(validWidth, validHeight);
        View.updateViewDependencies(validWidth, validHeight);
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
        
        if (Cache.session.difficulty === "challenge") {
            progress = "Level: " + level + " | " + progress;
        }
        
        $("#snakeHUD .challengeInfo").text(progress);
    },
    updateGameContainer: function (width, height) {
        var top = ($(document).height() - height) / 2;
                
        $("#gameContainer").css("top", top + "px")
        .width(width)
        .height(height);

        View.gameContWidth = width;
        View.gameContHeight = height;
    },
    updateViewDependencies: function (width, height) {
        if (width) {
            $("#canvas, #highScores, #home, #help, #maps .levelContainer, " + 
              "#gameViewUtils").width(width);
            
            View.alignMenuTabs(width);
            $("#slidingMenu").css("left",
                                  View.slidingMenu[View.slidingMenuTab] + "px");
        }
        
        if (height) {
            $("#canvas, #slidingMenu").height(height);
        }
        
        $(".centerBox").each(function () {
            View.centerElement($(this));
        });
    },
    selectDifficulty: function (difficulty) {
        Cache.session.difficulty = difficulty;
        $("#selectedDifficulty").text("difficulty: " + difficulty);
        
        if (difficulty === "custom") {
            $(".challengeInfo, #instructions, #pickUpCtrlInfo").hide();
            $("#custom, #snakeHUD .challengeInfo").show();
            
            View.centerElement($("#help .centerBox"));
            Helpers.readjustWallSlider();
        } else {
            $("#custom").hide();
            $("#instructions, #pickUpCtrlInfo").show();

            if (difficulty === "classic") {
                $(".challengeInfo").hide();
            } else {
                $(".challengeInfo").show();
            }
            
            var topPad = ($(document).height() - 
                          Cache.literals.compHeight) / 2;
            
            $("#gameContainer").animate({
                width : Cache.literals.compWidth + "px",
                height: Cache.literals.compHeight + "px",
                top: topPad + "px"
            }, {
                duration: "slow",
                queue: false,
                step: function (now, fx) {
                    if (fx.prop === "width") {
                        View.gameContWidth = now;
                        View.updateViewDependencies(now);
                    } else if (fx.prop === "height") {
                        View.gameContHeight = now;
                        View.updateViewDependencies(false, now);
                    }
                }
            });
            
            View.alignMenuTabs(Cache.literals.compWidth);
        }
        
        View.animateMenu("helpPos");
    },
    updateScore: function (points) {
        points = (Engine.activeDblPoints) ? points * 2 : points;
        Cache.session.score += points;
        
        $("#scoreBar").text(Cache.session.score + "pts");

        points = (points > 0) ? "+" + points : points;
        $("#pointAddition").html("<span>" + points + "pts<span>");
        
        if (Cache.addedPtsTimer) {
            clearTimeout(Cache.addedPtsTimer);
        }
        
        Cache.addedPtsTimer = setTimeout(function () {
            if ($.browser && $.browser.msie && $.browser.version < 9.0) {
                // This is an IE < 9 fix. Firstly, fadeout() is too processor 
                // intensive for IE and slows the game down noticeably.
                // It is, however, a desirable effect for faster browsers.
                // Finally, removing the span isn't immediate--the span hangs
                // around like an artifact before disappearing...
                // The solution is to replace the span with a &nbsp.
                $("#pointAddition").html("&nbsp;");
            } else {
                $("#pointAddition span").fadeOut();
            }
        }, 1000);
    },
    buildLevel: function () {
        $('<div id="levelContainer_' + Cache.session.level +
          '" class="levelContainer"></div>')
        .width(View.gameContWidth)
        .append('<div id="level_' + Cache.session.level +
                '" class="level"><div id="countdown"><div>3</div></div></div>')
        .appendTo("#mapsIE7Fix");
        
        if (Cache.session.difficulty === "challenge") {
            $("#countdown").prepend("<div id='currentLevel'>Level " +
                                    Cache.session.level + "</div>");
        } else {
            View.centerElement($("#countdown div"), $("#countdown"));
        }
        
        View.centerElement($("#countdown"));
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
        if (Cache.session.difficulty !== "custom") {
            Snake.segsToCreate = Snake.initSegs;
            Engine.powerUpDuration = 5;
        }
        
        switch (Cache.session.difficulty) {
        case "classic":
            Snake.speed = 76;
            Cache.session.humansPresent = 3;
            break;
        case "challenge":
            Snake.speed = 120;
            Cache.session.humansPresent = 0;
            
            // Determine the final level based on the level size.
            var maxWalls = Helpers.getMaxWalls();
            Cache.session.finalLevel = maxWalls / Cache.literals.wallMultiplier;
            break;
        case "custom":
            // -1 because the snake's head is always generated.
            Snake.segsToCreate = $("#startingLengthSlider").slider("value") - 1;
            Cache.session.humansPresent = $("#humansPresentSlider").slider("value");
            Engine.powerUpDuration = $("#powerUpDurationSlider").slider("value");
            // Convert the speed to milliseconds.
            Snake.speed = ($("#speedSlider").slider("option", "max") -
                          $("#speedSlider").slider("value")) * 10 + 20;
            break;
        }
        
        Helpers.buildTiles();
        View.buildLevel();
        Helpers.prepareLevel(Snake.initSegs, Cache.session.humansPresent);
    },
    resetSession: function () {
        Cache.resetCache();
        
        Engine.powerUpToggleTime = 0;
        
        $("#pauseMenu").hide();
        $("#clock").text(Engine.time = 0);
        $("#scoreBar").text(Cache.session.score + "pts");
    },
    gameOver: function () {
        if (document.getElementById("powerUpTimeBar")) {
            $("#powerUpTimeBar").stop();
        }
        
        $("#score").text("Score: " + Cache.session.score);
        $("#rank").text("Rank: -");
        
        if (Cache.session.difficulty === "custom") {
            $("#rank, #enterName").hide();
        } else {
            if (Cache.session.score >= 100) {
                $("input[name='name']").val("").removeAttr("disabled");
                $("#enterName span:last-child").attr("id",
                                                     "submit").text("Submit");
                $("#rank, #enterName").show();
            } else {
                $("#rank, #enterName").hide();
            }
        }
        
        $("#gameOver").appendTo("#level_" +
                                Cache.session.level).width(View.gameContWidth);
        $("#gameOver").show();
        View.centerElement($("#gameOver"));
        $("#enterName input").focus();
    },
    removeLevel: function (level) {
        $("#levelContainer_" + level || Cache.session.level).remove();
    }
};
