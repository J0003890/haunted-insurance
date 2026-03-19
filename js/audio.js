/* ================================================
   สำนักงานต้องสาป — AUDIO ENGINE
   js/audio.js

   All sounds generated via Web Audio API.
   Zero external audio files needed.
   Zero loading time.
   ================================================ */

const audio = (() => {

  let ctx         = null;   // AudioContext (created on first user gesture)
  let masterGain  = null;   // Master volume node — all sounds route through here
  let ambientGain = null;   // Separate gain for the ambient drone
  let ambientOscs = [];     // References to ambient oscillators (so we can stop them)
  let _muted      = false;  // Current mute state


  /* ================================================
     INIT
     Must be called AFTER a user gesture.
     Browser autoplay policy blocks AudioContext
     from creating before any interaction.
     We call this inside showScreen() so the first
     button tap initialises it automatically.
     ================================================ */
  function init() {
    if (ctx) {
      // Resume if browser suspended it (tab switch, screen lock, etc.)
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.65;
      masterGain.connect(ctx.destination);
    } catch (e) {
      // Device doesn't support Web Audio — game still works, just silent
      console.warn('สำนักงานต้องสาป: Web Audio API unavailable.', e);
    }
  }


  /* ================================================
     PRIVATE HELPER — play a single oscillator tone
     Called internally by all the sound functions.
     ================================================ */
  function _tone({
    type      = 'sine',   // oscillator waveform
    freq,                 // start frequency in Hz
    freqEnd   = null,     // optional: ramp to this frequency by end
    startTime,            // ctx.currentTime + delay
    duration,             // how long the tone lasts (seconds)
    peak      = 0.28,     // max volume (0–1, keep < 0.5 to avoid clipping)
  }) {
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }

    osc.connect(gain);
    gain.connect(masterGain);

    // Fade in sharply, fade out exponentially (natural decay)
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }


  /* ================================================
     CORRECT ANSWER
     Two clean ascending sine tones.
     C5 (523Hz) then G5 (784Hz) — satisfying but
     not too cheerful (this is still a horror game).
     ================================================ */
  function playCorrect() {
    if (!ctx || _muted) return;
    const now = ctx.currentTime;
    _tone({ freq: 523, startTime: now,        duration: 0.18, peak: 0.22 });
    _tone({ freq: 784, startTime: now + 0.13, duration: 0.24, peak: 0.18 });
  }


  /* ================================================
     WRONG ANSWER
     Low distorted sawtooth buzz — punishing but
     not ear-splitting. Drops from 110Hz to 50Hz.
     The distortion curve makes it feel gritty.
     ================================================ */
  function playWrong() {
    if (!ctx || _muted) return;
    const now = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const dist = ctx.createWaveShaper();
    const gain = ctx.createGain();

    // Mild soft-clip distortion curve
    const n     = 512;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x  = (i * 2) / n - 1;
      curve[i] = x < 0 ? -Math.pow(-x, 0.55) : Math.pow(x, 0.55);
    }
    dist.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    osc.connect(dist);
    dist.connect(gain);
    gain.connect(masterGain);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

    osc.start(now);
    osc.stop(now + 0.58);
  }


  /* ================================================
     DOOR HOVER
     Short triangle sweep — wooden creak.
     Plays when mouse enters a door area.
     Very subtle: peak gain is only 0.06.
     ================================================ */
  function playDoorHover() {
    if (!ctx || _muted) return;
    _tone({
      type:      'triangle',
      freq:      280,
      freqEnd:   90,
      startTime: ctx.currentTime,
      duration:  0.22,
      peak:      0.06,
    });
  }


  /* ================================================
     WALK THROUGH (fires when correct door swings open)
     White noise burst shaped into a wind whoosh.
     Sounds like air rushing through a doorway.
     ================================================ */
  function playWalkThrough() {
    if (!ctx || _muted) return;
    const now    = ctx.currentTime;
    const length = Math.floor(ctx.sampleRate * 0.4);

    // Generate white noise in a buffer
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // High-pass filter: removes low rumble, keeps airy whoosh texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.36);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.37);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(now);
    source.stop(now + 0.42);
  }


  /* ================================================
     STAGE PASS
     Three short ascending sine tones.
     A4 → C#5 → E5 — eerie minor-chord fanfare.
     Fires when a stage is completed successfully.
     ================================================ */
  function playStagePass() {
    if (!ctx || _muted) return;
    const now   = ctx.currentTime;
    [440, 554, 659].forEach((freq, i) => {
      _tone({ freq, startTime: now + i * 0.14, duration: 0.26, peak: 0.18 });
    });
  }


  /* ================================================
     STAGE FAIL (จรรยาบรรณ fail only)
     Three slow descending tones.
     E4 → B3 → F#3 — somber, final.
     ================================================ */
  function playStageFail() {
    if (!ctx || _muted) return;
    const now = ctx.currentTime;
    [330, 247, 185].forEach((freq, i) => {
      _tone({ freq, startTime: now + i * 0.26, duration: 0.38, peak: 0.16 });
    });
  }


  /* ================================================
     AMBIENT DRONE
     The sound of an old fluorescent office at night.
     Three layered components:
       40Hz sine   — sub bass room tone
       40.4Hz sine — slightly detuned: creates a slow
                     beating/pulsing effect (the office
                     "breathing")
       120Hz triangle — electrical fluorescent hum
     
     Fades in over 2.5 seconds.
     Almost inaudible (gain 0.02) but psychologically
     creates tension — players will feel it without
     consciously noticing it.
     ================================================ */
  function startAmbient() {
    if (!ctx || ambientOscs.length > 0) return;  // already running

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(
      _muted ? 0 : 0.02,
      ctx.currentTime + 2.5
    );
    ambientGain.connect(masterGain);

    // Each component has its own gain within the ambient mix
    const components = [
      { freq: 40,    type: 'sine',     vol: 1.0  },
      { freq: 40.4,  type: 'sine',     vol: 1.0  },
      { freq: 120,   type: 'triangle', vol: 0.22 },
    ];

    components.forEach(({ freq, type, vol }) => {
      const osc  = ctx.createOscillator();
      const g    = ctx.createGain();
      osc.type           = type;
      osc.frequency.value = freq;
      g.gain.value        = vol;
      osc.connect(g);
      g.connect(ambientGain);
      osc.start();
      ambientOscs.push(osc);
    });
  }

  function stopAmbient() {
    if (!ambientGain || ambientOscs.length === 0) return;
    const now = ctx.currentTime;
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.linearRampToValueAtTime(0, now + 0.8);
    // Stop oscillators after fade completes
    setTimeout(() => {
      ambientOscs.forEach(osc => { try { osc.stop(); } catch (_) {} });
      ambientOscs = [];
      ambientGain = null;
    }, 900);
  }


  /* ================================================
     MUTE TOGGLE
     Returns new mute state: true = muted.
     Updates master gain immediately.
     ================================================ */
  function toggleMute() {
    _muted = !_muted;
    if (masterGain) {
      masterGain.gain.setValueAtTime(
        _muted ? 0 : 0.65,
        ctx.currentTime
      );
    }
    return _muted;
  }

  function isMuted() { return _muted; }


  /* ================================================
     PUBLIC API
     ================================================ */
  return {
    init,
    playCorrect,
    playWrong,
    playDoorHover,
    playWalkThrough,
    playStagePass,
    playStageFail,
    startAmbient,
    stopAmbient,
    toggleMute,
    isMuted,
  };

})();