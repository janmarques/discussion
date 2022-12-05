/// <reference types="dom-speech-recognition" />

export class Discussion {
    /**
     * Results of the SpeechRecognition will arrive here
     */
    public onRecognitionResult: (ev: SpeechRecognitionEvent) => any;

    private recognition: SpeechRecognition;
    private utterance: SpeechSynthesisUtterance;
    private preferedVoice: SpeechSynthesisVoice;
    private isSynthesizing = false;
    private isRecognitionEnabled = true;
    private isGoodVoice = false;
    private voices: SpeechSynthesisVoice[];


    /**
     * Constructs the class. Make sure to call initialize() as well afterwards when your page is ready to go.
     * @param recognitionLanguageCode
     * @param synthesisLanguageCode
     * @param recognitionMaxAlternatives how many guesses for the recognition should be returned? (See https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/maxAlternatives)
     */
    constructor(private factory: () => SpeechRecognition, public recognitionLanguageCode = "en-GB", public synthesisLanguageCode = "en-GB", public recognitionMaxAlternatives = 10) {
    }

    /**
     * Lists all available synthesis voices. This list will only be filled after initialize() was called
     * */
    public getSynthesisVoices(): SpeechSynthesisVoice[] {
        return this.voices;
    }

    /**
     * Indicates whether the current synthesis language is installed locally (and thus faster in ending)
     * */
    public hasGoodVoice(): boolean {
        return this.isGoodVoice;
    }

    /**
     * Disable the recognition
     * */
    public disableRecognition() {
        this.isRecognitionEnabled = false;
        this.toggleRecognition();
    }

    /**
     * Re-enable the recognition
     * */
    public enableRecognition() {
        this.isRecognitionEnabled = true;
        this.toggleRecognition();
    }

    private toggleRecognition() {
        if (this.isRecognitionEnabled) {
            this.initializeRecognition();
            this.initializeSynthesis();
        } else {
            this.recognition.stop();
        }
    }

    /**
     * Setup the recognition and synthesis
     * */
    public initialize() {
        this.initializeSynthesis();
        this.initializeRecognition();
    }

    private initializeSynthesis() {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("")); // say nothing to load all voices

        this.voices = window.speechSynthesis.getVoices();
        this.preferedVoice = this.voices.filter(x => x.localService && x.lang.startsWith(this.synthesisLanguageCode.split("-")[0]))[0];
        this.isGoodVoice = !!this.preferedVoice;
    }

    private initializeRecognition() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch { }
        }
        this.recognition = this.factory();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.recognitionLanguageCode;
        this.recognition.maxAlternatives = this.recognitionMaxAlternatives;

        this.recognition.start();
        this.keepSpeechRecognitionAlive();

        this.recognition.onresult = (x) => {
            if (!this.onRecognitionResult) {
                throw "No event handler registered for a recognition result";
            } else {
                this.onRecognitionResult(x);
            }
        };

    }

    /**
     * Synthesize something to the user
     * @param text what to say
     * @param pitch at which pitch to say it (from 0 to 2)
     * @param rate how fast to say it (from 0.1 to 10)
     * @param volume how loud to say it (from 0 to 1)
     * @recognitionWaitPeriod While synthesizing, the recognition has to be stopped. Set this parameter to start listening again after N milliseconds. Set this parameter to 0 to wait until the synthesis is completely over (may take +- 1 second AFTER the voice is finished).
     */
    public synthesize(text: string, pitch: number = 1, rate: number = 1, volume: number = 1, recognitionWaitPeriod = 500) {
        this.isSynthesizing = true;
        this.recognition.stop();
        this.utterance = new SpeechSynthesisUtterance(text); // has to be global because of https://stackoverflow.com/questions/51645956/speechsynthesisutterance-onboundary-event-not-firing-properly
        this.utterance.volume = volume;
        this.utterance.rate = rate;
        this.utterance.pitch = pitch;
        this.utterance.lang = this.synthesisLanguageCode;
        this.utterance.voice = this.preferedVoice;


        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(this.utterance);

        if (recognitionWaitPeriod !== 0) {
            setTimeout(() => {
                this.isSynthesizing = false;
                try {
                    this.recognition.start();
                } catch { }
            }, recognitionWaitPeriod);
        }

        this.utterance.onend = () => {

            this.isSynthesizing = false;
            try {
                this.recognition.start();
            } catch { }
        }
        this.utterance.addEventListener("boundary", () => {
            this.isSynthesizing = false;
            try {
                this.recognition.start();
            } catch { }
        });
    }

    private keepSpeechRecognitionAlive() {
        this.recognition.onend = (_) => {
            if (this.isSynthesizing || !this.isRecognitionEnabled) {
                return;
            }
            try {
                this.recognition.start();
            } catch { }
        }
    }
}