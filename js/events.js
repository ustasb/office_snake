$(document).keydown(function (event) {
    var key = event.keyCode;
    
    // Prevents the player from immediately reversing directions via cycling directions.
    if (SnakeEngine.waitingForInput && Snake.head) {
        switch (key) {
        case 87: // w
        case 38: // Up Arrow
            if (Snake.head.direction !== "s") {
                Snake.head.direction = "n";
                SnakeEngine.waitingForInput = false;
            }
            break;
        case 68: // d
        case 39: // Right Arrow
            if (Snake.head.direction !== "w") {
                Snake.head.direction = "e";
                SnakeEngine.waitingForInput = false;
            }
            break;
        case 83: // s
        case 40: // Down Arrow
            if (Snake.head.direction !== "n") {
                Snake.head.direction = "s";
                SnakeEngine.waitingForInput = false;
            }
            break;
        case 65: // a
        case 37: // Left Arrow
            if (Snake.head.direction !== "e") {
                Snake.head.direction = "w";
                SnakeEngine.waitingForInput = false;
            }
            break;
        }
    }
    
    // Pause if 'Esc', 'Space' or 'p' are pressed.
    if (key === 27 || key === 32 || key === 80) {
        SnakeEngine.pause();
    }
});

$(window).resize(function () {
    SnakeView.updateGameContainer(SnakeView.gameContWidth, SnakeView.gameContHeight);
});

$(".back").click(function () {
    $(".ui-resizable-handle").hide();
    
    if (document.getElementById("loading")) {
        $("#loading").remove();
    }

    SnakeView.animateMenu("homePos");
    SnakeCache.session.difficulty = undefined;
});

$("#mainMenu span").click(function () {
    var action = $(this).text().toLowerCase();
    
    if (action === "high scores") {
        SnakeView.animateMenu("highScoresPos", function () {
            SnakeView.loadHighScores(SnakeView.highScoresView);
        });
    } else {
        SnakeView.selectDifficulty(action);
    }
    
    if (action === "high scores" || action === "custom") {
        $(".ui-resizable-handle").show();
    }
});

$("#highScoresView span").click(function () {
    var difficulty = $(this).text().toLowerCase();
    if (difficulty !== " | ") {
        SnakeView.highScoresView = difficulty;
        SnakeView.loadHighScores(SnakeView.highScoresView);
    }
});

$("#ready span").click(function () {
    if (SnakeCache.session.difficulty === "custom") {
        $(".ui-resizable-handle").hide();
    }
    
    SnakeView.initSession();
    
    SnakeView.animateMenu("mapsPos", function () {
        SnakeEngine.countdown(3);
    });
});

$("#retry").click(SnakeHelpers.retry);

$("#resume").click(SnakeEngine.resume);

$(".goToMenu").click(function () {
    SnakeView.animateMenu("homePos", function () {
        $("#gameOver").appendTo("#gameViewUtils").hide();
        SnakeHelpers.clearLevel();
        SnakeView.removeLevel(SnakeCache.session.level);
        SnakeView.resetSession();
    });
});

$("#gameContainer").resizable({
    handles: "se",
    minWidth: 500,
    minHeight: 500,
    resize: function (event, ui) {
        SnakeView.updateGameContainer(ui.size.width, ui.size.height);
        SnakeView.updateViewDependencies(ui.size.width, ui.size.height);
    },
    stop: function (event, ui) {
        SnakeView.alignGameWinToGrid(SnakeCache.literals.tileWidth, SnakeCache.literals.tileHeight);
        
        SnakeHelpers.readjustWallSlider();
        
        // Deal with the number of high scores on display.
        if (SnakeView.slidingMenuTab === "highScoresPos") {
            if (ui.originalSize.height < ui.size.height) {
                SnakeView.loadHighScores(SnakeView.highScoresView);
            } else {
                var numOfScores, scoreRows, scoresToDelete;
                
                numOfScores = $(".highscore").length;
                scoreRows = (ui.size.height - (4 * SnakeCache.literals.tileHeight)) / SnakeCache.literals.tileHeight;
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
    if (name.search(/\W/) === -1 && nameLength >= minLen && nameLength <= maxLen) {
        $("#enterName").append("<span>Saving...</span>");

        handleSuccess = function(rank) {
            $("#rank").text("Rank: " + rank);
            $("#enterName span:last-child").text("Saved.");
            $("#enterName input").attr("disabled", "disabled");
        };

        if (HighScores) {
            HighScores.put(name, SnakeCache.session.difficulty, SnakeEngine.time, SnakeCache.session.score, handleSuccess)
        }

    } else {
        var $error, errorMsg;

        if (nameLength < minLen) {
            errorMsg = "Names must be at least " + minLen + " letters.";
        } else if (nameLength > maxLen) {
            errorMsg = "Names must be less than " + (maxLen + 1) + " letters.";
        } else {
            errorMsg = "Names can only contain alphanumeric characters.";
        }
        
        $error = $("<span id='error'>" + errorMsg + "</span>");
        $("#enterName").append($error);
        
        setTimeout(function () {
            $error.fadeOut(1500, function () {
              $("#enterName").append("<span id='submit'>Submit</span>");
            });
        }, 1000);
    }
});
