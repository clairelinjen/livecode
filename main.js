var livecode;       // textarea
var button;           // button
var score = [];     // array of Phrase objects
var beat = 1.5;
var start = false;


function updateScore(){
    score = [];
    var lines = livecode.value.split("\n");
    for(let i = 0; i < lines.length; i++){
        if (lines[i].replace(/\s/g, '').length) {
            var p = new ReadLine(lines[i]); // in readline.js
            score.push(p);
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    livecode = document.getElementById("livecode");
    button = document.getElementById("play");
    button.addEventListener("click", play);

    var comp = audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-50, audioCtx.currentTime);
    comp.connect(audioCtx.destination);

    function play(){
        if (!start){

        }
        updateScore();
        for (let i = 0; i < score.length; i++){
            loop2(score[i],beat);
        }
    }


    function loop2(line, beat){
        var notes = line.notes;
        var elapsed = 0;
        var osc = audioCtx.createOscillator();
        var node = audioCtx.createGain();
        osc.connect(node).connect(comp).connect(audioCtx.destination);
        node.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.start();

        for (let i = 0; i < notes.length; i++){
            var now = audioCtx.currentTime + elapsed;
            var dur = beat / notes[i][1];
            if (notes[i][0] != null){
                osc.frequency.setValueAtTime(notes[i][0], now);
                node.gain.linearRampToValueAtTime(.8, now + dur/10);
                node.gain.setValueAtTime(.8, now + 9*dur/10);
                node.gain.linearRampToValueAtTime(0, now + dur);
            }
            else{
                node.gain.setValueAtTime(0,now + dur);
            }
            elapsed += dur;
        }
    }
});

