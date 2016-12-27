import view from './view.html'

export const audioCtx = window.AudioContext
  ? new window.AudioContext()
  : new window.webkitAudioContext() // eslint-disable-line new-cap

/**
 * App state.
 */
export const state = {
  audioActive: false,
  audioData: {},
  currentScale: [
    {name: 'c', disabled: false},
    {name: 'c#', disabled: false},
    {name: 'd', disabled: false},
    {name: 'd#', disabled: false},
    {name: 'e', disabled: false},
    {name: 'f', disabled: false},
    {name: 'f#', disabled: false},
    {name: 'g', disabled: false},
    {name: 'g#', disabled: false},
    {name: 'a', disabled: false},
    {name: 'a#', disabled: false},
    {name: 'b', disabled: false}
  ],
  clampToNote: false,
  convolver: audioCtx.createConvolver(),
  curNotes: [],
  gain: audioCtx.createGain(),
  oscillator: audioCtx.createOscillator(),
  reverb: { enabled: false },
  waves: [
    'sine',
    'square',
    'sawtooth',
    'triangle'
  ],
  overlayVisible: true,
  vibrato: { dir: 1, val: 1, rate: 10, amplitude: 5, interval: () => {} },
  viewEls: {
    allowedNotes: view.querySelector('#allowed-notes'),
    bufferSrc: view.querySelector('#custom-buffer-source'),
    clampToNote: view.querySelector('#clamp-to-note'),
    controls: view.querySelector('#controls'),
    vibratoAmplitube: view.querySelector('#vibrato-amplitude'),
    vibratoRate: view.querySelector('#vibrato-rate'),
    noteDisplay: view.querySelector('#note-display'),
    overlay: view.querySelector('#overlay'),
    toggleReverb: view.querySelector('#toggle-reverb'),
    toggleVibrato: view.querySelector('#enable-vibrato'),
    waves: view.querySelector('#waves')
  },
  tremolo: { rate: 10, amplitude: 5, enabled: false },
  effects: { vibrato: {}, tremolo: {} }
}
