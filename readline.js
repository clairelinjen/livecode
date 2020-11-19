class ReadLine {
    constructor(line){
        //this.arr = line.split(" ");
        this.key = "";
        this.arr = this.scan(line.split(""));
        this.setValues();
    }

    scan(l){
        var temp = [];
        var arr = [];

        while (l.length > 0){
            var c = l.shift();
            if (c === "="){
                if (temp.length > 0){
                    this.key = temp.join("");
                    temp = []
                }
                else{
                    this.key = arr[arr.length-1];
                    arr.pop();
                }
            }
            else if (c === "*"){
                if (temp.length > 0){
                    temp.push(c);
                    arr.push(temp.join(""));
                    temp = [];
                }
                else{
                    arr[arr.length -1] = arr[arr.length -1].concat(c);
                }
            }
            else if (c === " "){
                if (temp.length > 0){
                    arr.push(temp.join(""));
                    temp = [];
                }
            }
            else if (c === "(" || c === ")"){
                if (temp.length > 0){
                    arr.push(temp.join(""));
                    temp = [];
                }
                arr.push(c);
            }
            else{
                temp.push(c);
            }
        }
        arr.push(temp.join(""));
        return arr;
    }

    setValues(){
        var result = this.noteSchedule(this.arr);
        this.notes = result[0];
        // a 'note' is a length 2 array, note[0] is freq, note[1] is denominator of the fraction of the beat
        // [440, 2] means the note is 440 hz and lasts half a beat
        this.beats = result[1];
    }

    noteSchedule(arr){
        var schedule = [];
        var beats = 0;

        while (arr.length > 0){
            var curr = arr.shift();
            if (curr === ""){
                //continue
            }
            else {
                var c = this.specialChar(curr, arr);
                if (c != null) {
                    schedule = schedule.concat(c[0]);
                    beats += c[1];
                    arr = c[2];
                } else {
                    var n = parseInt(curr);
                    if (isNaN(n) || n < 0 || n > 127) {
                        if (curr === "x"){
                            schedule.push([genNotes(schedule), 1]);
                            console.log("sched "+schedule);
                        }
                        else{
                            schedule.push([null, 1]);
                        }
                    } else {
                        schedule.push([n, 1]);
                    }
                    beats += 1;
                }
            }
        }
        return [schedule, beats, arr]
    }

    specialChar(curr, arr){
        if (curr === "("){
            return this.group(arr);
        }
        else if (curr.slice(curr.length-1) === '*'){
            return this.sequence(curr, arr);
        }
        else{
            return null;
        }
    }

    sequence(curr, arr){
        var fit = false;
        var mult = 1;
        var beats = 1;
        if (curr.slice(curr.length-2) === '**'){
            fit = true;
            mult = parseInt(curr.slice(0,curr.length-2));
        }
        else{
            mult = parseInt(curr.slice(0,curr.length-1));
            beats = mult;
        }

        var notes = [];
        curr = arr.shift();
        if (curr === "(") {
            var g = this.group(arr);
            for (let i = 0; i < mult; i++) {
                notes = notes.concat(g[0]);
            }
            arr = g[2];
        }
        else {
            var a = [];
            for (let i = 0; i < mult; i++) {
                a.push(curr);
            }
            var sch = this.noteSchedule(a);
            notes = sch[0];
        }

        if (fit){
            for (let i = 0; i < notes.length; i++){
                notes[i][1] *= mult;
            }
        }
        return [notes, beats, arr]
    }

    group(arr){
        var gr = [];
        var curr = arr.shift();
        var ins = [];
        var index = -1;
        var addBeats = 0;
        while (arr.length > 0 && curr !== ")"){
            gr.push(curr);
            curr = arr.shift();
            var c = this.specialChar(curr,arr);
            if (c != null){
                ins = c[0];
                addBeats = c[1];
                arr = c[2];
                curr = arr.shift();
                index = gr.length;
            }
        }

        var notes = [];
        var beats;
        if (arr.length === 0 && curr !== ")"){
                // should throw an error
            beats = 0;
        }
        else{
            var sch = this.noteSchedule(gr);
            for (let i = 0; i < sch[0].length; i++){
                if (i === index){
                    notes = notes.concat(ins);
                }
                notes.push(sch[0][i])
            }
            if (index === notes.length){
                notes = notes.concat(ins);
            }
            beats = 1;
            var denom = sch[1] + addBeats;

            for (let i = 0; i < notes.length; i++){
                notes[i][1] *= denom;
            }
        }
        return [notes, beats, arr];
    }
}

music_rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
music_rnn.initialize();

function genNotes(notes) {

    var fnotes = format(notes);
    //the RNN model expects quantized sequences
    const qns = mm.sequences.quantizeNoteSequence(fnotes, 4);

    //and has some parameters we can tune
    rnn_steps = 40; //including the input sequence length, how many more quantized steps (this is diff than how many notes) to generate
    rnn_temperature = 1.1; //the higher the temperature, the more random (and less like the input) your sequence will be

    // we continue the sequence, which will take some time (thus is run async)
    // "then" when the async continueSequence is done, we play the notes
    music_rnn
        .continueSequence(qns, rnn_steps, rnn_temperature)
        .then((sample) => {
            console.log("done")
            var result = mm.sequences.unquantizeSequence(sample);
            console.log(result.notes[notes.length-1].pitch);
            notes[notes.length-1][0] = result.notes[notes.length-1].pitch;
            console.log("CHANGE "+notes)
            return result.notes[notes.length-1].pitch;
        })

}

function format(n) {
    var steps = [];
    var st = 0.0;
    var end = 0.0;
    for (let i = 0; i < n.length; i++){
        end = st + 1/n[i][1];
        steps.push({pitch: n[i][0], startTime: st, endTime: end});
        st = end;
    }
    var fnotes = {notes: steps, totalTime: end};
    console.log(fnotes);
    return fnotes;
}

