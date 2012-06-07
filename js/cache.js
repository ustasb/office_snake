var Cache = {
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
        var param;

        Cache.tiles = [[]];
        Cache.pickUps = [];
        Cache.walls = [];

        for (param in Cache.session) {
            if (Cache.session.hasOwnProperty(param)) {
                Cache.session[param] = 0;
            }
        }

        Cache.session.difficulty = undefined;
        Cache.session.level = 1;
        Snake.segsToKill[0] = 0;
    }
};
