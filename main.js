var livecode;       // textarea
var button;           // button
var score = [];     // arr of ReadLine objects
var loops = {};
var activeKeys = [];
var beat = 1.5;
var beatcount = 0;

function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}

function updateScore(){
    score = [];
    var lines = livecode.value.split("\n");
    for(let i = 0; i < lines.length; i++){
        if (lines[i].replace(/\s/g, '').length) {
            var l = new ReadLine(lines[i]); // in readline.js
            score.push(l);
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    livecode = document.getElementById("livecode");
    button = document.getElementById("play");
    button.addEventListener("click", change);

    var comp = audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-50, audioCtx.currentTime);
    comp.connect(audioCtx.destination);

    class Loop{
        constructor(readline){
            this.notes = readline.notes;
            this.beats = readline.beats;
            this.osc = audioCtx.createOscillator();
            this.gain = audioCtx.createGain();
            this.start = 0;
            this.newBeats = readline.beats;
            this.del = false;
            this.setUp();
        }

        setUp(){
            this.osc.connect(this.gain).connect(comp);
            this.gain.gain.setValueAtTime(0, audioCtx.currentTime);
            this.osc.start();
        }
    }

    function change(){
        updateScore();
        var newKeys = [];
        for (let i = 0; i < score.length; i++){
            var line = score[i];
            if (activeKeys.includes(line.key)){
                loops[line.key].notes = line.notes;
                loops[line.key].beats = line.beats;
            }
            else{
                loops[line.key] = new Loop(line);
            }
            newKeys.push(line.key);
        }
        for (let i=0; i < activeKeys.length; i++){
            if (!newKeys.includes(activeKeys[i])){
                console.log("delete "+activeKeys[i]);
                loops[activeKeys[i]].del = true;
            }
        }
        activeKeys = newKeys;

    }

    function playLoop(loop, time){
        var notes = loop.notes;
        var g = loop.gain;
        var elapsed = 0;
        for (let i = 0; i < notes.length; i++){
            var now = time + elapsed;
            var dur = beat / notes[i][1];
            if (notes[i][0] != null){
                g.gain.setValueAtTime(0,now);
                loop.osc.frequency.setValueAtTime(midiToFreq(notes[i][0]), now);
                g.gain.linearRampToValueAtTime(.8, now + dur/9);
                g.gain.setValueAtTime(.8, now + 8*dur/9);
                g.gain.linearRampToValueAtTime(0, now + dur);
            }
            else{
                loop.gain.gain.setValueAtTime(0,now + dur);
            }
            elapsed += dur;
        }
    }

    function stopLoop(key, time){
        setTimeout(function(){
            loops[key].osc.stop();
            delete loops[key].osc;
            delete loops[key].gain;
            delete loops[key]
        }, loops[key].beats * beat * 1000)

    }

    var nextBeat = audioCtx.currentTime;

    function scheduler() {

        while(nextBeat < audioCtx.currentTime + 0.1) {

            nextBeat += beat;
            beatcount += 1;
            for (var key in loops){
                if (loops[key].start === 0 || nextBeat >= loops[key].start + loops[key].beats * beat){
                    if (loops[key].del === true){
                        stopLoop(key, nextBeat);
                        loops[key].del = "deleting";
                    }
                    else if (loops[key].del === false){
                        playLoop(loops[key], nextBeat);
                        loops[key].beats = loops[key].newBeats;
                        loops[key].start = nextBeat;
                    }
                }
            }
        }
        timerID = window.setTimeout(scheduler, 30.0);
    };
    scheduler();


});



