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

SnakeSegment.prototype = {
    create: function () {
        if (Snake.segments.length !== 1) {
            this.tilePos = this.leaderSegment.previousTilePos;
        }
        
        SnakeHelpers.drawObjToTile(this, true);
        $("#level_" + SnakeCache.session.level).append(this.$html);
    },
    moveHead: function () {
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
    },
    follow: function () {
        this.previousTilePos = this.tilePos;
        this.tilePos = this.leaderSegment.previousTilePos;

        SnakeHelpers.drawObjToTile(this, true);
    },
    destroy: function (keepHtml) {
        SnakeCache.tiles[this.tilePos[0]][this.tilePos[1]].obj = undefined;

        for (var i = 0, j = Snake.segments.length; i < j; i++) {
            if (this === Snake.segments[i]) {
                Snake.segments.splice(i, 1);
            }
        }

        if (!keepHtml) {
            this.$html.remove();
        }
    }
};
