var HighScores = {
    get: function (numOfScores, difficulty, doneCallback) {
        $.ajax({
          type: "POST",
          url: "../cgi-bin/hsGetter.py",
          data: {amt: numOfScores, diff: difficulty}
        }).done(doneCallback);
    },
    put: function (name, difficulty, time, score, doneCallback) {
        $.ajax({
          type: "POST",
          url: "../cgi-bin/hsSetter.py",
          data: {name: name, diff: difficulty, time: time, score: score}
        }).done(doneCallback);
    }
};
