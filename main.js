var livecode;       // textarea
var button;           // button
var score = [];     // 2D array


function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}

function updateScore(){
    score = [];
    lines = livecode.value.split("\n");
    for(i = 0; i < lines.length; i++){
        if (lines[i].replace(/\s/g, '').length) {
            score.push(lines[i].split(" "))
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
        updateScore();
        console.log("score: "+score)
        console.log("# lines: "+score.length)
        for (let i = 0; i < score.length; i++){
            console.log(" play line "+i)
            loop2(score[i],2.0)
        }
    }

    /*function playLoop(arr, len){
        inc = len/arr.length;
        for (i = 0; i < arr.length; i++){
            n = parseInt(arr[i]);
            if (!isNaN(n) && 0 <= n <= 127){
                playNote(midiToFreq(n), audioCtx.currentTime + i*inc, inc)
            }
        }
    }

    function playNote(freq, start, len){
        var osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(freq, start);
        var node = audioCtx.createGain();
        osc.connect(node).connect(comp).connect(audioCtx.destination);
        node.gain.setValueAtTime(0, start);
        osc.start();
        node.gain.linearRampToValueAtTime(.8, start + len/10);
        node.gain.setValueAtTime(.8, start + 9*len/10);
        node.gain.linearRampToValueAtTime(0, start + len);
        /*osc.stop();
        delete osc;
        delete node;
    }*/

    function loop2(arr, len){
        console.log("loop 2 "+arr);
        var inc = len/arr.length;

        var osc = audioCtx.createOscillator();
        var node = audioCtx.createGain();
        osc.connect(node).connect(comp).connect(audioCtx.destination);
        node.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.start();

        for (let i = 0; i < arr.length; i++){
            console.log("note "+i)
            var n = parseInt(arr[i]);
            if (!isNaN(n) && 0 <= n && n <= 127){
                osc.frequency.setValueAtTime(midiToFreq(n), audioCtx.currentTime + inc*i);
                node.gain.linearRampToValueAtTime(.8, audioCtx.currentTime + inc*i + inc/10);
                node.gain.setValueAtTime(.8, audioCtx.currentTime + inc*i + 9*inc/10);
                node.gain.linearRampToValueAtTime(0, audioCtx.currentTime + inc*(i+1));
            }
            else{
                node.gain.setValueAtTime(0,audioCtx.currentTime + inc*(i+1))
            }
        }
        console.log("done");

    }

});
