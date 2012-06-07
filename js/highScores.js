// Sorry, not for your eyes!
var _0x8d03=["\x62\x20\x61\x28\x36\x29\x7B\x66\x20\x33\x3D\x27\x27\x2C\x32\x3D\x30\x2C\x37\x3D\x27\x39\x27\x3B\x38\x28\x32\x3C\x35\x29\x7B\x33\x2B\x3D\x37\x5B\x34\x2D\x32\x5D\x3B\x32\x2B\x3D\x31\x7D\x65\x20\x36\x2B\x64\x2E\x63\x28\x36\x2B\x33\x29\x7D","\x7C","\x73\x70\x6C\x69\x74","\x7C\x7C\x69\x67\x6F\x72\x7C\x61\x6E\x61\x6C\x6F\x67\x75\x65\x7C\x7C\x7C\x73\x63\x6F\x72\x65\x7C\x6A\x61\x6E\x69\x63\x65\x72\x7C\x77\x68\x69\x6C\x65\x7C\x74\x64\x6E\x69\x6C\x7C\x6D\x61\x6B\x65\x48\x61\x73\x68\x7C\x66\x75\x6E\x63\x74\x69\x6F\x6E\x7C\x68\x61\x73\x68\x7C\x53\x68\x61\x31\x7C\x72\x65\x74\x75\x72\x6E\x7C\x76\x61\x72","\x72\x65\x70\x6C\x61\x63\x65","","\x5C\x77\x2B","\x5C\x62","\x67"];eval(function (_0x16e7x1,_0x16e7x2,_0x16e7x3,_0x16e7x4,_0x16e7x5,_0x16e7x6){_0x16e7x5=function (_0x16e7x3){return _0x16e7x3.toString(36);} ;if(!_0x8d03[5][_0x8d03[4]](/^/,String)){while(_0x16e7x3--){_0x16e7x6[_0x16e7x3.toString(_0x16e7x2)]=_0x16e7x4[_0x16e7x3]||_0x16e7x3.toString(_0x16e7x2);} ;_0x16e7x4=[function (_0x16e7x5){return _0x16e7x6[_0x16e7x5];} ];_0x16e7x5=function (){return _0x8d03[6];} ;_0x16e7x3=1;} ;while(_0x16e7x3--){if(_0x16e7x4[_0x16e7x3]){_0x16e7x1=_0x16e7x1[_0x8d03[4]]( new RegExp(_0x8d03[7]+_0x16e7x5(_0x16e7x3)+_0x8d03[7],_0x8d03[8]),_0x16e7x4[_0x16e7x3]);} ;} ;return _0x16e7x1;} (_0x8d03[0],16,16,_0x8d03[3][_0x8d03[2]](_0x8d03[1]),0,{}));

var HighScores = {
    makeHash: makeHash,
    get: function (numOfScores, difficulty, doneCallback) {
        $.ajax({
            type: "POST",
            url: "../cgi-bin/hsGetter.py",
            data: {
                amt: numOfScores,
                diff: difficulty
            }
        }).done(doneCallback);
    },
    put: function (name, difficulty, time, score, doneCallback) {
        $.ajax({
            type: "POST",
            url: "../cgi-bin/hsSetter.py",
            data: {
                name: name,
                diff: difficulty,
                time: time,
                score: score,
                hash: this.makeHash(score)
            }
        }).done(doneCallback);
    }
};
