$(document.body).keydown(function (event) {
    var key = event.keyCode;
    
    // Prevents the player from immediately reversing directions
    // via cycling directions.
    if (Engine.waitingForInput && Snake.head) {
        switch (key) {
        case 87: // w
        case 38: // Up Arrow
            if (Snake.head.direction !== "s") {
                Snake.head.direction = "n";
                Engine.waitingForInput = false;
            }
            break;
        case 68: // d
        case 39: // Right Arrow
            if (Snake.head.direction !== "w") {
                Snake.head.direction = "e";
                Engine.waitingForInput = false;
            }
            break;
        case 83: // s
        case 40: // Down Arrow
            if (Snake.head.direction !== "n") {
                Snake.head.direction = "s";
                Engine.waitingForInput = false;
            }
            break;
        case 65: // a
        case 37: // Left Arrow
            if (Snake.head.direction !== "e") {
                Snake.head.direction = "w";
                Engine.waitingForInput = false;
            }
            break;
        }
    }
    
    // Pause if 'Esc', 'Space' or 'p' are pressed.
    if (key === 27 || key === 32 || key === 80) {
        Engine.pause();
    }
});

$(window).resize(function () {
    View.updateGameContainer(View.gameContWidth, View.gameContHeight);
});

$(".back").click(function () {
    $(".ui-resizable-handle").hide();
    
    if (document.getElementById("loading")) {
        $("#loading").remove();
    }

    View.animateMenu("homePos");
    Cache.session.difficulty = undefined;
});

$("#mainMenu span").click(function () {
    var action = $(this).text().toLowerCase();
    
    if (action === "high scores") {
        View.animateMenu("highScoresPos", function () {
            View.loadHighScores(View.highScoresView);
        });
    } else {
        View.selectDifficulty(action);
    }
    
    if (action === "high scores" || action === "custom") {
        $(".ui-resizable-handle").show();
    }
});

$("#highScoresView span").click(function () {
    var difficulty = $(this).text().toLowerCase();
    if (difficulty !== " | ") {
        View.highScoresView = difficulty;
        View.loadHighScores(View.highScoresView);
    }
});

$("#ready").click(function () {
    if (Cache.session.difficulty === "custom") {
        $(".ui-resizable-handle").hide();
    }
    
    View.initSession();
    
    View.animateMenu("mapsPos", function () {
        Engine.countdown(3);
    });
});

$("#retry").click(Helpers.retry);

$("#resume").click(Engine.resume);

$(".goToMenu").click(function () {
    View.animateMenu("homePos", function () {
        $("#gameOver").appendTo("#gameViewUtils").hide();
        Helpers.clearLevel();
        View.removeLevel(Cache.session.level);
        View.resetSession();
    });
});

$("#gameContainer").resizable({
    handles: "se",
    minWidth: 500,
    minHeight: 500,
    resize: function (event, ui) {
        View.updateGameContainer(ui.size.width, ui.size.height);
        View.updateViewDependencies(ui.size.width, ui.size.height);
    },
    stop: function (event, ui) {
        View.alignGameWinToGrid(Cache.literals.tileWidth,
                                Cache.literals.tileHeight);
        
        Helpers.readjustWallSlider();
        
        // Deal with the number of high scores on display.
        if (View.slidingMenuTab === "highScoresPos") {
            if (ui.originalSize.height < ui.size.height) {
                View.loadHighScores(View.highScoresView);
            } else {
                var numOfScores, scoreRows, scoresToDelete;
                
                numOfScores = $(".highscore").length;
                scoreRows = (ui.size.height - 4 * Cache.literals.tileHeight) /
                            Cache.literals.tileHeight;
                scoresToDelete = numOfScores - scoreRows;
                
                for (var i = 0; i < scoresToDelete; i++) {
                    $(".highscore").last().remove();
                }
            }
        }
        
    }
});

$("#submit").live("click", function () {
    var name, nameLength, handleSuccess, minLen = 3, maxLen = 15;
    
    name = $("input[name='name']").val();
    nameLength = name.length;
    
    $("#enterName span:last-child").remove();
    
    // Validate the given name.
    if (name.search(/\W/) === -1 && nameLength >= minLen &&
        nameLength <= maxLen) {
        $("#enterName").append("<span>Saving...</span>");

        handleSuccess = function(rank) {
            $("#rank").text("Rank: " + rank);
            $("#enterName span:last-child").text("Saved.");
            $("#enterName input").attr("disabled", "disabled");
        };

        if (HighScores) {
            HighScores.put(name, Cache.session.difficulty, Engine.time,
                           Cache.session.score, handleSuccess)
        }

    } else {
        var $error, errorMsg;

        if (nameLength < minLen) {
            errorMsg = "Names must be at least " + minLen + " letters.";
        } else if (nameLength > maxLen) {
            errorMsg = "Names must be less than " + (maxLen + 1) +
                       " letters.";
        } else {
            errorMsg = "Names can only contain alphanumeric characters.";
        }
        
        $error = $("<span id='error'>" + errorMsg + "</span>");
        $("#enterName").append($error);
        
        setTimeout(function () {
            $error.fadeOut(1500, function () {
              $("#enterName").append("<span id='submit' " + 
                                     "class='button'>Submit</span>");
            });
        }, 1000);
    }
});
