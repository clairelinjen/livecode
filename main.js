var livecode;       // textarea
var playbutton;
var stopbutton;
var errorbox;
var score = [];     // arr of ReadLine objects
var loops = {};
var activeKeys = [];
var beat = 1.5;
var currentbeats = 0;
var on = false;

function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}

document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    livecode = document.getElementById("livecode");
    playbutton = document.getElementById("play");
    playbutton.addEventListener("click", change);
    stopbutton = document.getElementById("stop");
    stopbutton.addEventListener("click", stopPlaying);
    errorbox = document.getElementById("er");

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

    function updateScore(){
        score = [];
        errorbox.innerHTML = "";
        var lines = livecode.value.split("\n");
        var keys = {};
        for(let i = 0; i < lines.length; i++){
            if (lines[i].replace(/\s/g, '').length) {
                var l = new ReadLine(lines[i]); // in readline.js
                if (l.key === ""){
                    error(l.errors, i+1);
                }
                else if (l.key in keys){
                    error(["Duplicate key \'"+l.key+"\'",], i+1);
                }
                else{
                    score.push(l);
                    keys[l.key] = true;
                }
            }
        }
    }

    function error(arr, l){
        for (let i=0; i < arr.length; i++){
            var error = "ERROR: Line "+l+" - "+arr[i]+"<br>";
            errorbox.innerHTML += error;
        }
    }

    function change(){
        console.log("click");
        updateScore();
        var newKeys = [];
        for (let i = 0; i < score.length; i++){
            var line = score[i];
            if (activeKeys.includes(line.key)){
                loops[line.key].notes = line.notes;
                loops[line.key].newBeats = line.beats;
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
        if (!on){
            scheduler();
            on = true;
        }
    }

    function stopPlaying(){
        score = [];
        for (let i=0; i < activeKeys.length; i++){
            loops[activeKeys[i]].del = true;
        }
    }

    function playLoop(loop, time){
        var notes = loop.notes;
        var g = loop.gain;
        var elapsed = 0;
        for (let i = 0; i < notes.length; i++){
            var now = time + elapsed;
            var dur = beat / notes[i][1];
            if (notes[i][0] != null && notes[i][0] !== "x"){
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

    function stopLoop(key){
        setTimeout(function(){
            loops[key].osc.stop();
            //delete loops[key].osc;
            //delete loops[key].gain;
            delete loops[key]
        }, loops[key].beats * beat * 1000)

    }

    var nextBeat = audioCtx.currentTime;

    function scheduler() {

        while(nextBeat < audioCtx.currentTime + 0.1) {

            nextBeat += beat;
            currentbeats += 1;
            console.log(currentbeats);
            for (var key in loops){
                if (loops[key].start === 0 || nextBeat >= loops[key].start + loops[key].beats * beat){
                    if (loops[key].del === true){
                        stopLoop(key);
                        loops[key].del = "deleting";
                    }
                    else if (loops[key].del === false){
                        console.log("play loop at "+currentbeats);
                        console.log("length of loop: "+loops[key].beats);
                        loops[key].beats = loops[key].newBeats;
                        playLoop(loops[key], nextBeat);
                        loops[key].start = nextBeat;
                    }
                }
            }
        }
        timerID = window.setTimeout(scheduler, 30.0);
    };

});



