(function ($, undefined) {
	"use strict";
	var SnakeCache, SnakeView, SnakeHelpers, SnakeEngine, Snake;
	
	function PickUp(type) {
		SnakeCache.pickUps.push(this);
	
		this.type = type;
		if (type === "human") {
			this.type = "human";
			SnakeCache.session.humanCount += 1;
		} else if (type === "powerUp") {
			var generateType, pUpType, pUpTypes = ["dblPoints", "shrink", "slowTime", "invincible"];
			
			generateType = function () {
				return pUpTypes[Math.floor(Math.random() * pUpTypes.length)];
			};
			
			pUpType = generateType();
			this.type = (pUpType === "invincible") ? generateType() : pUpType; // Make the invincibility power-up rarer.

			SnakeCache.session.displayedPowerUp = this;
		} else if (type === "portal") {
			this.type = "portal";
		}
		
		this.$html = $("<div class='pickUp " + this.type + "'></div>");
		this.tilePos = [0, 0];
	}
	
	PickUp.toggleSmile = function (triggerObj) {
		for (var i = 0, j = SnakeCache.pickUps.length; i < j; i++) {
			if (SnakeCache.pickUps[i].type === "human") {
				var human = SnakeCache.pickUps[i];
				
				if (Math.abs(triggerObj.tilePos[0] - human.tilePos[0]) < 4 &&
					Math.abs(triggerObj.tilePos[1] - human.tilePos[1]) < 4) {
					human.$html.addClass("frown");
				} else {
					human.$html.removeClass("frown");
				}
			}
		}
	};
	
	PickUp.togglePowerUp = function () { // Gets called by SnakeEngine.tick() every x seconds.
		if (SnakeCache.session.activePowerUp) {
			SnakeCache.session.activePowerUp.togglePowerUp();
		} else {
			if (SnakeCache.session.displayedPowerUp) {
				SnakeCache.session.displayedPowerUp.destroy();
			} else {
				(new PickUp("powerUp")).create();
			}
			SnakeEngine.powerUpToggleTime = SnakeEngine.time;
		}
	};
	
	PickUp.prototype.create = function (givenTilePos) {
		var tilePos = (givenTilePos) ? givenTilePos : SnakeHelpers.findEmptyTile();
	
		this.tilePos[0] = tilePos[0];
		this.tilePos[1] = tilePos[1];	

		if (this.type === "human") {
			this.$html.addClass("smile");
		} else if (this.type === "powerUp") {
			this.$html.addClass(this.type);
		}
		
		SnakeHelpers.drawObjToTile(this, true);
		$("#level_" + SnakeCache.session.level).append(this.$html);
		return this;
	};
	
	PickUp.prototype.destroy = function (keepHtml) {
		SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;
		
		if (this.type === "human") {
			SnakeCache.session.humanCount -= 1;
		} else if (this.type !== "portal" && this.type !== "human") { // Refers to a power-up type.
			SnakeCache.session.displayedPowerUp = false;
		}

		for (var i = 0, j = SnakeCache.pickUps.length; i < j; i++) {
			if (this === SnakeCache.pickUps[i]) {
				SnakeCache.pickUps.splice(i, 1);
			}
		}
		
		if (!keepHtml) {
			this.$html.remove();
		}
	};
	
	PickUp.prototype.togglePowerUp = function () {
		SnakeEngine.powerUpToggleTime = SnakeEngine.time;
		
		if (SnakeCache.session.activePowerUp) {
			SnakeCache.session.activePowerUp = false;
			
			if (this.type !== "shrink") {
				$(".head").removeClass("pickUp " + this.type);
			}
			
			if (document.getElementById("powerUpTimeBar")) {
				$("#powerUpTimeBar").stop();
				$("#powerUpTimeBar").remove();
			}
		} else {
			SnakeCache.session.activePowerUp = this;
			
			if (this.type !== "shrink") {
				$(".head").addClass("pickUp " + this.type);
			}
		}
		
		switch (this.type) {
		case "dblPoints":
			if (SnakeCache.session.activePowerUp) {
				SnakeEngine.activeDblPoints = true;
				SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
			} else {
				SnakeEngine.activeDblPoints = false;
			}
			break;
		case "shrink":
			if (SnakeCache.session.activePowerUp) {
				if (Snake.segsToKill[0]) {
					Snake.removeDeadSegments();
				}
				if (Snake.segments.length > 3) { // Prevents the power-up from killing the snake.
					Snake.killSegments(3);
				}
			}
			break;
		case "slowTime":
			if (SnakeCache.session.activePowerUp) {
				Snake.speed *= 2;
				SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
			} else {
				Snake.speed /= 2;
			}
			break;
		case "invincible":
			var speed = (SnakeCache.session.difficulty === "challenge") ? 0.5 : 0.65;
			if (SnakeCache.session.activePowerUp) {
				Snake.invincible = true;
				
				Snake.speed *= speed;
				SnakeView.powerUpTimeBar(SnakeEngine.powerUpDuration);
			} else {
				Snake.invincible = false;
				Snake.speed /= speed;
			}
			break;
		}
	};
	
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
	
	Wall.prototype.build = function () {
		SnakeHelpers.drawObjToTile(this, true);
		$("#level_" + SnakeCache.session.level).append(this.$html);
	};
	
	Wall.prototype.explode = function () {
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
	};
	
	Wall.prototype.destroy = function (keepHtml) {
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
	};
	
	function SnakeSegment() {
		Snake.segments.push(this);
		var snakeSegsLength = Snake.segments.length;
		if (snakeSegsLength === 1) {
			Snake.head = this;
		}
		
		var cssClassName = (this === Snake.head) ? "head" : "snakeSeg";
		this.$html = $("<div id='" + "seg_" + snakeSegsLength + "' class='" + cssClassName + "'></div>");
		
		this.leaderSegment = (snakeSegsLength !== 1) ? Snake.segments[snakeSegsLength - 2] : undefined;
		this.direction = (snakeSegsLength !== 1) ? this.leaderSegment.direction : "e";
		this.tilePos = [0, 0]; // y, x
		this.previousTilePos = [0, 0];
	}

	SnakeSegment.prototype.create = function () {
		if (Snake.segments.length !== 1) {
			this.tilePos = this.leaderSegment.previousTilePos;
		}
		
		SnakeHelpers.drawObjToTile(this, true);
		$("#level_" + SnakeCache.session.level).append(this.$html);
	};
	
	SnakeSegment.prototype.moveHead = function () {
		var attr;
		this.previousTilePos = this.tilePos.slice(0); // Copy the array.

		switch (Snake.head.direction) {
		case "n":
			this.tilePos[0] = (this.tilePos[0] === 0) ? SnakeCache.tilesYLimit : this.tilePos[0] -= 1;
			attr = "top";
			break;
		case "e":
			this.tilePos[1] = (this.tilePos[1] === SnakeCache.tilesXLimit) ? 0 : this.tilePos[1] += 1;
			attr = "left";
			break;
		case "s":
			this.tilePos[0] = (this.tilePos[0] === SnakeCache.tilesYLimit) ? 0 : this.tilePos[0] += 1;
			attr = "top";
			break;
		case "w":
			this.tilePos[1] = (this.tilePos[1] === 0) ? SnakeCache.tilesXLimit : this.tilePos[1] -= 1;
			attr = "left";
			break;
		}

		SnakeHelpers.drawObjToTile(this, false, attr);

		// If humans are in range, make them frown.
		PickUp.toggleSmile(Snake.head);
	};
	
	SnakeSegment.prototype.follow = function () {
		this.previousTilePos = this.tilePos;
		this.tilePos = this.leaderSegment.previousTilePos;

		SnakeHelpers.drawObjToTile(this, true);
	};
	
	SnakeSegment.prototype.destroy = function (keepHtml) {
		SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;

		for (var i = 0, j = Snake.segments.length; i < j; i++) {
			if (this === Snake.segments[i]) {
				Snake.segments.splice(i, 1);
			}
		}

		if (!keepHtml) {
			this.$html.remove();
		}
	};
	
	Snake = {
		version: 1.5,
		head: undefined,
		initSegs: 6,
		segsToCreate: 0,
		segsToKill: [0, 0], // [Segments to kill, Time when to remove the segments]
		invincible: false,
		speed: undefined,
		segments: [],
		grow: function (segments) {
			for (var i = 0; i < segments; i++) {
				(new SnakeSegment()).create();
			}
		},
		move: function () {
			var segment, headTile, hitObj;
			
			for (var i = 0, j = Snake.segments.length; i < j; i++) {
				segment = Snake.segments[i];
				
				if (i === 0) {
					segment.moveHead();
				} else {
					segment.follow();
				}
				
				if (i === j - 1) { // Empty the last segment's previous tile of any objects.
					SnakeCache.tiles[segment.previousTilePos[0]][segment.previousTilePos[1]].obj = undefined;
				}
			}
			
			headTile = SnakeCache.tiles[Snake.head.tilePos[0]][Snake.head.tilePos[1]];
			hitObj = headTile.obj;
			headTile.obj = Snake.head;
			
			return hitObj;
		},
		animate: function () {
			var hitObj = Snake.move();
			
			if (hitObj) {
				if (hitObj instanceof PickUp) {
					Snake.eat(hitObj);
				} else if (hitObj instanceof Wall) {
					if (!Snake.collide(hitObj)) {
						return false;
					}
				} else if (hitObj instanceof SnakeSegment && !Snake.invincible && !hitObj.$html.hasClass("deadSnakeSeg")) {
					return false;
				}
			}
			
			return true; // The snake has survived.
		},
		eat: function (matchedItem) {
			if (matchedItem.type === "human") {
				SnakeView.updateScore(10);
				
				Snake.segsToCreate += 1;
				
				if (SnakeCache.session.humanCount <= SnakeCache.session.humansPresent) {
					(new PickUp("human")).create();
				}
			} else if (matchedItem.type === "portal") {
				SnakeCache.session.segments = Snake.segments.length;
				
				// Create the illusion that the snake has entered the portal.
				Snake.head.$html.css("backgroundColor", "#afafaf");
				if (SnakeCache.session.activePowerUp && SnakeCache.session.activePowerUp.type !== "shrink") {
					$(".head").removeClass("pickUp " + SnakeCache.session.activePowerUp.type);
				}
				
				SnakeCache.enteringPortal = true;
			} else { // Must be a power-up.
				matchedItem.togglePowerUp();
			}
			
			matchedItem.destroy();
		},
		collide: function (hitWall) {
			var wallPoints = 30;
			
			if (hitWall.hasBomb && !Snake.invincible) {
				wallPoints = -50;
				
				hitWall.explode();
				
				if (!Snake.killSegments(4)) {
					return false;
				}
			} else {
				hitWall.destroy();
				Snake.segsToCreate += 1;
			}
			SnakeView.updateScore(wallPoints);
			Wall.updateNeighborWalls();
			
			return true; // The snake is still alive.
		},
		killSegments: function (segsToKill, time, preserveExisting) { // Highlights the dead segments red.
			var tempSeg;
			
			if (!preserveExisting && Snake.segsToKill[0] > 0) {
				Snake.removeDeadSegments(); // Remove any segments already waiting for removal.
			}
			
			Snake.segsToKill[0] = segsToKill;
			Snake.segsToKill[1] = time || (SnakeEngine.time + 1);
			
			for (var i = 1; i <= segsToKill; i++) {
				tempSeg = Snake.segments[Snake.segments.length - i];
				
				if (tempSeg) {
					tempSeg.$html.addClass("deadSnakeSeg");
				} else {
					return false;
				}
			}
			
			if (segsToKill >= Snake.segments.length) {
				return false; // The snake has died.
			}
			
			return true;
		},
		removeDeadSegments: function () {
			var lastObj;
		
			while (Snake.segsToKill[0]) {
				Snake.segments[Snake.segments.length - 1].destroy();
				Snake.segsToKill[0] -= 1;
			}
			
			lastObj = Snake.segments[Snake.segments.length - 1];
			SnakeCache.tiles[lastObj.tilePos[0]][lastObj.tilePos[1]].obj = undefined;
		}
	};
	
	SnakeCache = {
		tiles: [[]],
		tilesYLimit: 0,
		tilesXLimit: 0,
		walls: [],
		pickUps: [],
		enteringPortal: false,
		addedPtsTimer: undefined,
		literals: {
			compWidth: 600,
			compHeight: 600,
			tileHeight: 20,
			tileWidth: 20,
			wallMultiplier: 10
		},
		session: {
			difficulty: undefined,
			activePowerUp: undefined,
			displayedPowerUp: undefined,
			finalLevel: 0,
			score: 0,
			segments: 0,
			humansPresent: 0, // The number of humans to be on the screen at once.
			level: 1,
			gems: 0,
			humanCount: 0
		},
		resetCache: function () {
			SnakeCache.tiles = [[]];
			SnakeCache.pickUps = [];
			SnakeCache.walls = [];
			
			for (var param in SnakeCache.session) {
				if (SnakeCache.session.hasOwnProperty(param)) {
					SnakeCache.session[param] = 0;
				}
			}
			
			SnakeCache.session.difficulty = undefined;
			SnakeCache.session.level = 1;
			Snake.segsToKill[0] = 0;
		}
	};
	
	SnakeView = {
		// Record what the gameContainer's dimensions should be because the browser
		// can't be expected to return accurate measurements when zooming.
		gameContWidth: 0,
		gameContHeight: 0,
		hsRequestTime: 0,
		highscoresView: "classic",
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
						$("#highscores table").append($csvRow);
						
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
				$("#canvas, #highscores, #home, #help, #maps .levelContainer, #gameViewUtils").width(width);
				
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
	
	SnakeHelpers = {
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
	
	SnakeEngine = {
		isOn: false,
		waitingForInput: true,
		time: 0,
		powerUpDuration: 5,
		powerUpToggleTime: 0,
		powerOn: function () {
			SnakeEngine.isOn = true;
			SnakeEngine.tick();
			SnakeEngine.gameLoop();
		},
		gameLoop: function () {
			if (SnakeEngine.isOn) {
				
				if (SnakeCache.enteringPortal) {
					SnakeHelpers.enterPortal();
				} else {
					SnakeEngine.waitingForInput = true;
					
					// If animate() returns true, the snake is still alive.
					if (Snake.animate()) {
						
						if (Snake.segsToCreate !== 0) {
							(new SnakeSegment()).create();
							Snake.segsToCreate -= 1;
							
							if (Snake.segsToKill[0]) {
								// If dead segments are pending for removal and the snake grows, reapply the 'deadSnakeSeg' class.
								$(".deadSnakeSeg").removeClass("deadSnakeSeg");
								Snake.killSegments(Snake.segsToKill[0], Snake.segsToKill[1], true);
							}
						}
						
						if (Snake.segsToKill[0] > 0 && Snake.segsToKill[1] <= SnakeEngine.time) {
							Snake.removeDeadSegments(); // Remove the dead segments.
						}
						
					} else {
						SnakeEngine.isOn = false;
												
						setTimeout(SnakeView.gameOver, 500);
					}
				}
				
				setTimeout(SnakeEngine.gameLoop, Snake.speed);
			}
		},
		countdown: function (seconds) {
			if (seconds > 0) {
				$("#countdown div:last-child").text(seconds);
			
				setTimeout(function () {
					SnakeEngine.countdown(seconds - 1);
				}, 1000);
			} else {
				$("#countdown").remove();
				SnakeEngine.powerOn();
			}
		},
		tick: function () {
			if (SnakeEngine.isOn) {
				SnakeEngine.time += 1;
				
				if (SnakeEngine.time >= (SnakeEngine.powerUpToggleTime + SnakeEngine.powerUpDuration)) {
					PickUp.togglePowerUp();
				}
				
				var time = SnakeView.formatTimeStr(SnakeEngine.time);
				$("#clock").text(time);

				setTimeout(SnakeEngine.tick, 1000);
			}
		},
		pause: function () {
			if (SnakeEngine.isOn) {
				SnakeEngine.isOn = false;
				
				if (document.getElementById("powerUpTimeBar")) {
					$("#powerUpTimeBar").stop();
				}
				
				SnakeView.centerElement($("#pauseMenu")).show();
			}
		},
		resume: function () {
			$("#pauseMenu").hide();
			
			// The time remaining on the power-up before the pause.
			if (document.getElementById("powerUpTimeBar")) {
				var powerUpTimeRemain = (SnakeEngine.powerUpToggleTime + SnakeEngine.powerUpDuration) - SnakeEngine.time;
				SnakeView.powerUpTimeBar(powerUpTimeRemain);
			}
			
			SnakeEngine.powerOn();
		}
	};
		
// ---------------------- Display + Events ----------------------
// --------------------------------------------------------------

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
		
		if (action === "highscores") {
			SnakeView.animateMenu("highScoresPos", function () {
				SnakeView.loadHighScores(SnakeView.highscoresView);
			});
		} else {
			SnakeView.selectDifficulty(action);
		}
		
		if (action === "highscores" || action === "custom") {
			$(".ui-resizable-handle").show();
		}
	});
	
	$("#highscoresView span").click(function () {
		var difficulty = $(this).text().toLowerCase();
		if (difficulty !== " | ") {
			SnakeView.highscoresView = difficulty;
			SnakeView.loadHighScores(SnakeView.highscoresView);
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
			
			// Deal with the number of highscores on display.
			if (SnakeView.slidingMenuTab === "highScoresPos") {
				if (ui.originalSize.height < ui.size.height) {
					SnakeView.loadHighScores(SnakeView.highscoresView);
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
                print(rank)
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
	
// ---------------------- Initialize Game ----------------------
// -------------------------------------------------------------

	SnakeView.initialize(800, 540);
	
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
			max = SnakeHelpers.getMaxWalls();
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
	
})(jQuery);
