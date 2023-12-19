//wait for page to load
document.addEventListener("DOMContentLoaded", function(event){
    //initialize audioCtx, oscillators, and gain nodes for later
    var audioCtx;
    var oscMel;
    var melGain;
    var oscMood;
    var oscMood2;
    var moodGain;
    var secondNote;
    var secondGain;
    var distortion;
    var filter;
    var globalGain;

    var oscillators;

    //set initial values
    const b = document.getElementById("bpm");
    var bpm = b.value;
    const m = document.querySelector("select[name=mood]");
    var mood = m.value;
    const startTimeO = document.getElementById("start")
    var timePassed = startTimeO.value;
    var stop = timePassed;

    var dval = "";
    var bval = "";
    var level = "";
    var tval = 0;

    var moveSeq = [];
    var currMove = {
        "start time": timePassed,
        "body": bval,
        "direction": dval,
        "level": level,
        "duration": tval
    }

    // Functional Features
        // Default display
        var display = "";
        const defaultDisplay = "Please Add a Movement:";
        updateDisplay();

        // Change Display After Sequence Update
        function updateDisplay(){
            if (moveSeq.length != 0){
                display = "";
                var currOut = "";
                for (let item of moveSeq){
                    if (item.body == "Pause"){
                        currOut = `Start Time: ${item['start time']}, ${item.body}, Duration: ${item.duration}`;
                    } else{
                        currOut = `Start Time: ${item['start time']}, Body: ${item.body}, Direction: ${item.direction}, Level: ${item.level}, Duration: ${item.duration}`;
                    }
                    display = display + currOut + "<br>";
                }
                display = display + "End Time: " + timePassed;
            } else {
                display = defaultDisplay;
            }
            document.getElementById('display').innerHTML = display;
        }

        //Set or Reset initial Composition Settings
        const setButton = document.getElementById('soundSettings');
        setButton.addEventListener('click', function() {
            if(setButton.style.backgroundColor == "rgb(96, 96, 249)"){
                bpm = b.value;
                mood = m.options[m.selectedIndex].value;
                timePassed = startTimeO.value; 
                console.log(bpm, mood, timePassed)
            } else {
                re();
            }
        }, false);

        function re(){
            setDefault(60, b, bpm)
            setDefault(0, startTimeO, timePassed)
            m.selectedIndex = "happy"
            mood = "happy";
            console.log("reset)");
        }

        function setDefault(input , attribute, variable) {
            variable = input
            attribute.value = input
        }

        //Clear Display and MoveSeq
        const clearButton = document.getElementById('clear');
        clearButton.addEventListener('click', function() {
            clear();
        }, false);
        function clear(){
            moveSeq = [];
            updateDisplay();
            timePassed = 0;
            document.getElementById("soundSettings").style.background='#FFFFFF';
        }

        // Play or Stop Generated Music
        const playButton = document.getElementById('play');
        playButton.addEventListener('click', function() {
            if(!audioCtx){
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                globalGain = audioCtx.createGain();
                globalGain.gain.value = 0.8;
                globalGain.connect(audioCtx.destination);
                play();
            } else if (audioCtx.state === 'suspended') {
                audioCtx.resume();
                globalGain.gain.value = 0.8;
                play();
            } else if (audioCtx.state === 'running') {
                globalGain.gain.value = 0;
                moodGain.gain.value = 0;
                oscillators = [oscMel, oscMood, oscMood2, secondNote];
                oscillators.forEach (osc => {osc.stop()})
                audioCtx.suspend();
            } else {
            }
        }, false);

    // Movement Sequence and Display Editing
        // Add new movement
        const addButton = document.getElementById('add');
        addButton.addEventListener('click', function() {
            // read in and update current move
            var d = document.querySelector("select[name=direction]")
            dval = d.options[d.selectedIndex].value;
            var b = document.querySelector("select[name=bodypart]")
            bval = b.options[b.selectedIndex].value;
            var l = document.querySelector("select[name=level]")
            level = l.options[l.selectedIndex].value;
            tval = document.getElementById("time").value;

            currMove = {
                "start time": timePassed,
                "body": bval,
                "direction": dval,
                "level": level,
                "duration": tval
            }

            // Add currMove to moveSeq
            moveSeq.push(currMove);

            //update display values
            timePassed = parseFloat(timePassed) + parseFloat(tval);
            updateDisplay();
        }, false);

        // Remove last movement in sequence
        const removeButton = document.getElementById('remove');
        removeButton.addEventListener('click', function() {
            // remove last move from full Seq
            moveSeq.pop(moveSeq.length-1);
            timePassed = timePassed - parseFloat(moveSeq[moveSeq.length-1]["duration"]);
            updateDisplay();
        }, false);

        // Insert pause into movement sequence
        const pauseButton = document.getElementById('pause');
        pauseButton.addEventListener('click', function() {
            //insert a pause into the moveSeq with specified duration
            const pause = {
                "start time": timePassed,
                "body": "Pause",
                "duration": document.getElementById("time").value
            }

            moveSeq.push(pause);

            //update values
            timePassed = parseInt(pause["start time"]) + parseInt(pause["duration"]);
            updateDisplay();
        }, false);
            
        //Load preformatted json file for demonstration
        const demoButton = document.getElementById('demo');
        demoButton.addEventListener('click', function() {
                // load demo squence
                fetch('./seq.json').then(response => response.json()).then(data => {
                    // clear current data
                    clear()
                    re();
                    // copy demo file data to moveSeq
                    const map = data.seq;
                    map.forEach(item => {timePassed = timePassed + item.duration;});
                    moveSeq = map
                    updateDisplay();
                }).catch(error => console.error('Error fetching JSON:', error));
            }, false);

    //Designing Generated Music
        //octave down divide by 2, octave up multiply by 2
        const bodypartfrequencymap = {
            'Head': 270.55155243368355,
            'Chest': 450.531330204045503,
            'Right Foot': 261.625565300598634,  //C
            'Right Knee': 277.182630976872096, //C#
            'Right Hip': 293.664767917407560,  //D
            'Right Hand': 311.126983722080910, //D#
            'Right Elbow': 329.627556912869929,  //E
            'Right Shoulder': 349.228231433003884,  //F
            'Left Shoulder': 369.994422711634398, //F#
            'Left Elbow': 391.995435981749294,  //G
            'Left Hand': 415.304697579945138, //G#
            'Left Hip': 440.000000000000000,  //A
            'Left Knee': 466.163761518089916, //A#
            'Left Foot': 493.883301256124111,  //B
        }

        const moodfrequencymap = {
            'happy': 225,
            'sad': 125,
            'angry': 250,
            'afraid': 300,
            'disgusted': 175,
            'surprised': 350
        }

        // small-integer ratios use for intervals going up - 3/2 (perfect fifth), 3/4 (perfect fourth), 6/5 (minor third).
        // use the reciprical to go down
        const directionintervalmap = {
            'Forward': 1.0,
            'Right Forward Diagonal': 0.75,
            'Right Side': 1.5,
            'Right Backward Diagonal': 0.833333,
            'Backward': 1,
            'Left Backward Diagonal': 1.333333,
            'Left Side': 0.666666,
            'Left Forward Diagonal': 1.2
        }

        // prepare all oscillator
        function play(){
            // set mood, underlying tone controlled by frequency oscillator dependent on mood selection
            oscMood = audioCtx.createOscillator();
            oscMood.frequency.value = 30;
            oscMood2 = audioCtx.createOscillator();
            oscMood2.frequency.value = moodfrequencymap[mood];
            moodGain = audioCtx.createGain();
            moodGain.gain.value = 0;
            moodGain.gain.setTargetAtTime(0.4, audioCtx.currentTime + 1, 0.01);
            moodGain.gain.setTargetAtTime(0.2, audioCtx.currentTime + timePassed, 0.01)
            oscMood.connect(oscMood2.frequency)
            oscMood2.connect(moodGain).connect(globalGain);
            oscMood.start();
            oscMood2.start();

            // prep main melody node
            oscMel = audioCtx.createOscillator();
            melGain = audioCtx.createGain();
            melGain.gain.value = 0;
            oscMel.connect(melGain)
            oscMel.start();

            // prep second note node
            secondNote = audioCtx.createOscillator();
            secondGain = audioCtx.createGain();
            secondGain.gain.value = 0;
            secondNote.connect(secondGain).connect(melGain).connect(globalGain);
            secondNote.start();

            // prep wave distortion node --> from Web Audio Docs
            distortion = audioCtx.createWaveShaper();

            function makeDistortionCurve(amount) {
                const k = typeof amount === "number" ? amount : 50;
                const n_samples = 256;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;

                for (let i = 0; i < n_samples; i++) {
                    const x = (i * 2) / n_samples - 1;
                    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
                }

                return curve;
            }

            distortion.curve = makeDistortionCurve(400);
            distortion.oversample = "4x";

            // prep filter node
            filter = audioCtx.createBiquadFilter();
            filter.type = "bandpass";
            filter.gain.value = 25;

            //begin analysing sequence
            setTimeout(playMelody(), moveSeq[0]["start time"]*1000)
        }

        // play through movement sequence
        function playMelody(){
            let timeElapsedSecs = 0;
            var bps = (bpm/60);

            var previous = "";
            var nextDisconnectNode = globalGain;

            moveSeq.forEach(noteData => {
                if (noteData["body"] == "Pause"){
                    melGain.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01) //start attack
                    oscMel.frequency.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01)
                    timeElapsedSecs= timeElapsedSecs + noteData["duration"]/bps; //decay time
                } else {
                    var pitch = bodypartfrequencymap[noteData["body"]];
                    if (noteData["level"] == "high"){pitch = pitch * 2}
                    if (noteData["level"] == "low"){pitch = pitch / 2}
                    //assess changes to be made based on previous movement
                    // repeated movement causes distortion, change between right body, left body, head, and chest adds bandpass filter center at main note pitch
                    // only one effect can happen at a time with distortion taking precedence over the filter
                    console.log(nextDisconnectNode);
                    melGain.disconnect(nextDisconnectNode);
                    if (previous == noteData["body"]){
                        melGain.connect(distortion).connect(globalGain)
                        nextDisconnectNode = distortion;
                    } else if (previous[0] != noteData["body"][0]){
                        filter.frequency.value = pitch;
                        melGain.connect(filter).connect(globalGain);
                        nextDisconnectNode = filter;
                    } else {
                        melGain.connect(globalGain);
                        nextDisconnectNode = globalGain;
                    }

                    previous = noteData["body"]

                    // play main note in melody
                    melGain.gain.setTargetAtTime(0.5, audioCtx.currentTime + timeElapsedSecs, 0.01) //start attack
                    oscMel.frequency.setTargetAtTime(pitch, audioCtx.currentTime + timeElapsedSecs, 0.01)

                    // second note
                    if (noteData["direction"][2] == 'single'){
                        //do nothing
                    } else{
                        secondGain.gain.setTargetAtTime(0.5, audioCtx.currentTime + timeElapsedSecs, 0.01) //start attack
                        var newpitch = pitch * directionintervalmap[noteData["direction"]];
                        secondNote.frequency.setTargetAtTime(newpitch, audioCtx.currentTime + timeElapsedSecs, 0.01)
                    }

                    // end notes being played
                    timeElapsedSecs= timeElapsedSecs + noteData["duration"]/bps; //decay time
                    melGain.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.02) //start decay

                    if (secondGain.gain.value != 0){
                        secondGain.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.02)
                    }
                }
            });

            melGain.connect(globalGain);

            // repeat until globalGain is set to 0 by the pause/play button
            if (globalGain.gain.value != 0){
                setTimeout(playMelody, timeElapsedSecs * 1000);
            }
        }
})