/* ==========================================
   AuraRead - Text-to-Speech Module
   Browser Web Speech API implementation
   ========================================== */

const TTSModule = (() => {
    const synth = window.speechSynthesis;
    let currentUtterance = null;
    let isPlaying = false;
    let isPaused = false;
    let currentText = '';
    let currentIndex = 0;
    let sentences = [];
    let currentVoice = null;
    let currentRate = 1;
    let currentPitch = 1;
    let currentVolume = 1;

    // Callbacks
    let callbacks = {
        onStart: null,
        onEnd: null,
        onPause: null,
        onResume: null,
        onSentenceChange: null,
        onError: null
    };

    // Initialize
    const init = () => {
        // Load voices when available
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = updateVoices;
        }
        updateVoices();
    };

    // Get available voices
    const updateVoices = () => {
        const voices = synth.getVoices();
        return voices;
    };

    const getVoices = () => {
        return synth.getVoices().map(voice => ({
            name: voice.name,
            lang: voice.lang,
            native: voice.name
        }));
    };

    // Split text into sentences
    const splitSentences = (text) => {
        // Split by sentence-ending punctuation
        return text.split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*\n\s*/)
            .filter(s => s.trim().length > 0);
    };

    // Speak text
    const speak = (text, options = {}) => {
        if (!synth) {
            if (callbacks.onError) callbacks.onError('Speech Synthesis not supported');
            return false;
        }

        // Stop any current speech
        stop();

        currentText = text;
        sentences = splitSentences(text);
        currentIndex = 0;

        const {
            voice = null,
            rate = 1,
            pitch = 1,
            volume = 1,
            onStart = null,
            onEnd = null,
            onError = null
        } = options;

        currentRate = Math.max(0.5, Math.min(2, rate));
        currentPitch = Math.max(0.5, Math.min(2, pitch));
        currentVolume = Math.max(0, Math.min(1, volume));

        if (onStart) callbacks.onStart = onStart;
        if (onEnd) callbacks.onEnd = onEnd;
        if (onError) callbacks.onError = onError;

        speakSentence(0, voice);
        return true;
    };

    const speakSentence = (index, voice = null) => {
        if (index >= sentences.length) {
            isPlaying = false;
            if (callbacks.onEnd) callbacks.onEnd();
            return;
        }

        currentIndex = index;
        const sentence = sentences[index];

        currentUtterance = new SpeechSynthesisUtterance(sentence);
        currentUtterance.rate = currentRate;
        currentUtterance.pitch = currentPitch;
        currentUtterance.volume = currentVolume;

        // Set voice if provided
        const voices = synth.getVoices();
        if (voice && voices.length > 0) {
            currentUtterance.voice = voice;
        } else if (voices.length > 0) {
            currentUtterance.voice = voices[0];
        }

        currentUtterance.onstart = () => {
            isPlaying = true;
            isPaused = false;
            if (callbacks.onSentenceChange) {
                callbacks.onSentenceChange({
                    index,
                    total: sentences.length,
                    text: sentence
                });
            }
            if (index === 0 && callbacks.onStart) callbacks.onStart();
        };

        currentUtterance.onend = () => {
            speakSentence(index + 1, voice);
        };

        currentUtterance.onerror = (event) => {
            if (callbacks.onError) callbacks.onError(event.error);
        };

        synth.speak(currentUtterance);
    };

    // Pause
    const pause = () => {
        if (!isPlaying) return false;
        synth.pause();
        isPaused = true;
        if (callbacks.onPause) callbacks.onPause();
        return true;
    };

    // Resume
    const resume = () => {
        if (!isPaused) return false;
        synth.resume();
        isPaused = false;
        if (callbacks.onResume) callbacks.onResume();
        return true;
    };

    // Stop
    const stop = () => {
        synth.cancel();
        isPlaying = false;
        isPaused = false;
        currentIndex = 0;
        return true;
    };

    // Play/Pause toggle
    const togglePlayPause = () => {
        if (isPlaying && !isPaused) {
            return pause();
        } else if (isPaused) {
            return resume();
        }
        return false;
    };

    // Next sentence
    const nextSentence = () => {
        if (!isPlaying) return false;
        synth.cancel();
        if (currentIndex + 1 < sentences.length) {
            speakSentence(currentIndex + 1);
            return true;
        }
        return false;
    };

    // Previous sentence
    const previousSentence = () => {
        if (!isPlaying) return false;
        synth.cancel();
        if (currentIndex > 0) {
            speakSentence(currentIndex - 1);
            return true;
        }
        return false;
    };

    // Set rate
    const setRate = (rate) => {
        currentRate = Math.max(0.5, Math.min(2, rate));
        if (currentUtterance) {
            currentUtterance.rate = currentRate;
        }
    };

    // Set pitch
    const setPitch = (pitch) => {
        currentPitch = Math.max(0.5, Math.min(2, pitch));
        if (currentUtterance) {
            currentUtterance.pitch = currentPitch;
        }
    };

    // Set volume
    const setVolume = (volume) => {
        currentVolume = Math.max(0, Math.min(1, volume));
        if (currentUtterance) {
            currentUtterance.volume = currentVolume;
        }
    };

    // Get current state
    const getState = () => {
        return {
            isPlaying,
            isPaused,
            currentIndex,
            totalSentences: sentences.length,
            currentText: sentences[currentIndex] || '',
            rate: currentRate,
            pitch: currentPitch,
            volume: currentVolume,
            progress: sentences.length > 0 ? currentIndex / sentences.length : 0
        };
    };

    // Check if speaking
    const isSpeaking = () => {
        return isPlaying;
    };

    // Check if paused
    const isPausedState = () => {
        return isPaused;
    };

    // Register callback
    const on = (event, callback) => {
        if (callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
            callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
        }
    };

    // Check support
    const isSupported = () => {
        return !!synth;
    };

    return {
        init,
        speak,
        pause,
        resume,
        stop,
        togglePlayPause,
        nextSentence,
        previousSentence,
        setRate,
        setPitch,
        setVolume,
        getVoices,
        getState,
        isSpeaking,
        isPausedState,
        on,
        isSupported
    };
})();

// Add to window
window.TTS = TTSModule;
