var State = {
    tiles: [[]],
    tilesYLimit: 0,
    tilesXLimit: 0,
    walls: [],
    pickUps: [],
    enteringPortal: false,
    addedPtsTimer: undefined,
    literals: {
        compWidth: 540,
        compHeight: 540,
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
    resetState: function () {
        var param;

        State.tiles = [[]];
        State.pickUps = [];
        State.walls = [];

        for (param in State.session) {
            if (State.session.hasOwnProperty(param)) {
                State.session[param] = 0;
            }
        }

        State.session.difficulty = undefined;
        State.session.level = 1;
        Snake.segsToKill[0] = 0;
    }
};
