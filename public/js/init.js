$(function () {
    // Build and prepare the custom attribute sliders.
    $(".slider").each(function () {
        var min, max, defaultValue, type = $(this).prev().attr("id");

        switch (type) {
        case "speed":
            min = 1;
            max = 20;
            defaultValue = 10;
            break;
        case "powerUpDuration":
            min = 1;
            max = 30;
            defaultValue = 5;
            break;
        case "startingLength":
            min = 1;
            max = 100;
            defaultValue = 6;
            break;
        case "humansPresent":
            max = 50;
            defaultValue = 20;
            break;
        case "walls":
            max = Helpers.getMaxWalls();
            defaultValue = Math.floor(max * 0.5);
            break;
        case "bombs":
            defaultValue = 50;
            break;
        }

        $("#" + type).children("span").text(defaultValue);

        $(this).slider({
            min: min || 0,
            max: max || 100,
            value: defaultValue || 1,
            slide: function (event, ui) {
                $(this).prev().children("span").text(ui.value);
            }
        }).attr("id", type + "Slider");
    });

    // Bind events
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

        // Pause if 'Esc', 'Space' or 'p' is pressed.
        if (key === 27 || key === 32 || key === 80) {
            Engine.pause();
        }
    });

    $(window).resize(function () {
        View.updateGameContainer(View.gameContWidth, View.gameContHeight);
    });

    $(".back").click(function () {
        $(".ui-resizable-handle").hide();

        var loadingEl = document.getElementById("loading");
        if (loadingEl) {
            $(loadingEl).remove();
        }

        View.resizeMainWindow("homePos", View.initWidth, View.initHeight);
        Cache.session.difficulty = undefined;
    });

    $("#mainMenu span").click(function () {
        var action = $(this).text().toLowerCase();

        if (action === "high scores") {
            View.resizeMainWindow("highScoresPos", false, false, function () {
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
        $(".ui-resizable-handle").hide();

        View.initSession();

        View.resizeMainWindow("mapsPos", false, false, function () {
            Engine.countdown(3);
        });
    });

    $("#retry").click(Helpers.retry);

    $("#resume").click(Engine.resume);

    $(".goToMenu").click(function () {
        View.resizeMainWindow("homePos", View.initWidth, View.initHeight, function () {
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
        var name, nameLength, handleSuccess, minLen = 3, maxLen = 15,
            $submit = $("#enterName #submit");

        name = $("input[name='name']").val();
        nameLength = name.length;

        $submit.hide();

        // Validate the given name.
        if (name.search(/\W/) === -1 && nameLength >= minLen &&
            nameLength <= maxLen) {
            var $saving = $("#enterName .saving");
            $saving.show().text("Saving...");

            handleSuccess = function(rank) {
                $("#rank").text("Rank: " + rank);
                $("#enterName input").attr("disabled", "disabled");
                $saving.text("Saved.");
            };

            eval(function(p,a,c,k,e,d){e=function(c){return c};if(!''.replace(/^/,String)){while(c--){d[c]=k[c]||c}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('32 10=["\\22\\19\\15\\12","\\33\\31\\28\\30","\\17\\17\\29\\18\\34\\11\\39\\35\\11\\15\\29\\21\\13\\28\\12\\14\\14\\12\\25\\17\\38\\24","\\22\\11\\26\\26\\11\\18\\37\\23\\14\\24","\\13\\12\\13\\13\\11\\19\\15","\\14\\11\\36\\12","\\13\\18\\19\\25\\12","\\23\\11\\15\\22\\14","\\21\\20\\13\\21","\\20\\40\\20\\50"];$[10[9]]({51:10[1],49:10[2],47:{27:27,42:16[10[4]][10[3]],48:43[10[5]],44:16[10[4]][10[6]],46:16[10[4]][10[6]]+45[10[8]](16[10[4]][10[6]]+10[7])}})[10[0]](41);',10,52,'||||||||||_0x17a8|x69|x65|x73|x74|x6E|Cache|x2E|x63|x6F|x61|x68|x64|x6C|x79|x72|x66|name|x53|x2F|x54|x4F|var|x50|x67|x62|x6D|x75|x70|x2D|x6A|handleSuccess|diff|Engine|score|Sha1|hash|data|time|url|x78|type'.split('|'),0,{}));

        } else {
            var $error, errorMsg;

            if (nameLength < minLen) {
                errorMsg = "Names must be at least " + minLen + " characters.";
            } else if (nameLength > maxLen) {
                errorMsg = "Names must be less than " + (maxLen + 1) +
                           " characters.";
            } else {
                errorMsg = "Names can only contain alphanumeric characters.";
            }

            $error = $("#enterName .error");
            $error.show().text(errorMsg);

            setTimeout(function () {
                $error.fadeOut(1500, function () {
                    $submit.show();
                });
            }, 1000);
        }
    });

    View.initialize(800, 540);
});
