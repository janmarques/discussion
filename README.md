Source: https://github.com/janmarques/discussion

Package: https://www.npmjs.com/package/discussion

# Discussion: combining SpeechRecognition and SpeechSynthesis
When working with SpeechRecognition and SpeechSynthesis, it is important that you don't synthesise while you are recognizing.

This package helps keep this in check. 

It will continually by SpeechRecognizing and passing those results to the `onRecognitionResult` callback.

But whenever you want to Synthesise something, you can do this using the `synthesize` method. The Recognition gets disabled and after the synthesis is done, it gets restarted.

## How to use
Install with `npm i discussion`

We need to have a bit of hacky stuff to ensure that in the recognition callback, we can access all the properties and the DOM from your own class. 

That is why we pass a factory method to create the SpeechRecognition rather than have the package do it itself.

Example:
```
    // in the header somewhere
    public CT = window.SpeechRecognition || webkitSpeechRecognition; 

    // in the constructor
    this.discussion = new Discussion(() => new this.CT(), this.language.code, this.language.code);
    this.discussion.onRecognitionResult = (x) => {
        // do something with result
    };

    // in the initializer (eg ngOnInit or whenever your page is loaded)
     this.discussion.initialize();


    // anywhere in your code
    this.discussion.synthesize("hello world");

```
