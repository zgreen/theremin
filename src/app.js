import * as styles from './app.css'
// const styles = require('./styles')
// import reverb from 'arraybuffer!./AbernyteGrainSilo.m4a'
// let view = {}
// const styles = require('promise?global!./app.css')
// styles().then((stylesObj) => {
//   view = require(`imports?styles=${stylesObj}!./view.html`)
// })
import view from './view.html'
const notes = require('promise?global!./music-freqs.json')
const reverb = require('promise?global!arraybuffer!./AbernyteGrainSilo.m4a')

/**
 * Audio.
 */
const audioCtx = window.AudioContext
  ? new window.AudioContext()
  : new window.webkitAudioContext() // eslint-disable-line new-cap

/**
 * App state.
 */
const state = {
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
  vibrato: { dir: 1, val: 1, rate: 10, amplitude: 5, interval: () => {} },
  tremolo: { rate: 10, amplitude: 5 }
}

/**
 * Audio.
 */
function initAudio () {
  if (state.audioActive) {
    state.gain.disconnect(audioCtx.destination)
    if (!state.reverb.enabled) {
      state.convolver.disconnect(state.gain)
      state.oscillator.disconnect(state.convolver)
    }
  }
  getReverb()
    .then((data) => {
      state.convolver.buffer = data
      // Convolver connects to gain
      if (state.reverb.enabled) {
        state.convolver.connect(state.gain)
      }
      // Oscillator connects to convolver
      state.oscillator.connect(state.reverb.enabled ? state.convolver : state.gain)
      // Gain connects to dest
      state.gain.connect(audioCtx.destination)
      state.oscillator.frequency.value = 0
      // Oscillator starts
      if (!state.audioActive) {
        state.oscillator.start()
        state.audioActive = true
      }
    })
}

function getReverb () {
  return new Promise((resolve, reject) => {
    if (!state.audioData.length) {
      reverb().then((file) => {
        audioCtx.decodeAudioData(file)
          .then((data) => {
            state.audioData = data
            resolve(state.audioData)
          })
      })
    } else {
      resolve(state.audioData)
    }
  })
}

/**
 * Fetch frequency data.
 */
function getNotes () {
  notes().then((json) => {
    state.curNotes = json
  })
}

/**
 * View.
 */
function initView () {
  // View parent
  view.classList.add(styles.view)
  // Overlay
  state.viewEls.overlay.classList.add(styles.overlay)
  state.viewEls.overlay.addEventListener('click', (e) => {
    e.target.remove()
    initAudio()
  })
  // Controls
  state.viewEls.controls.classList.add(styles.controls)
  // Add allowed notes
  state.viewEls.allowedNotes.classList.add(styles.notes)
  state.currentScale
    .map((note, idx) => {
      const el = document.createElement('div')
      const label = document.createElement('label')
      const input = document.createElement('input')
      label.innerHTML = note.name
      input.type = 'checkbox'
      input.setAttribute('checked', true)
      el.appendChild(label)
      el.appendChild(input)
      input.addEventListener('click', (e) => {
        state.currentScale[idx].disabled = !input.checked
      })
      return el
    })
    .reduce((init, cur) => {
      state.viewEls.allowedNotes.appendChild(cur)
      return init
    }, [])
  // Add waves
  state.viewEls.waves.innerHTML = state.waves.map((wave) => {
    return `<option value="${wave}">${wave}</option>`
  }).join('')
  state.viewEls.noteDisplay.classList.add(styles.noteDisplay)
  state.viewEls.waves.addEventListener('click', (e) => {
    state.gain.gain.value = 0
  })
  state.viewEls.waves.addEventListener('change', (e) => {
    state.oscillator.type = e.target.value
  })

  state.viewEls.clampToNote.addEventListener('click', (e) => {
    state.clampToNote = !state.clampToNote
  })
  state.viewEls.bufferSrc.addEventListener('submit', (e) => {
    e.preventDefault()
    // setBuffer(state.convolver, bufferInput.value)
  })
  state.viewEls.toggleVibrato.addEventListener('click', () => {
    setVibrato()
  })

  state.viewEls.vibratoRate.value = state.vibrato.rate
  state.viewEls.vibratoAmplitube.value = state.vibrato.amplitude
  state.viewEls.vibratoRate.addEventListener('change', () => {
    setVibrato(setVibrato(state.viewEls.vibratoRate.value))
  })
  state.viewEls.vibratoAmplitube.addEventListener('change', () => {
    setVibrato(state.vibrato.rate, state.viewEls.vibratoAmplitube.value)
  })
  // Toggle Reverb
  state.viewEls.toggleReverb.addEventListener('click', () => {
    state.reverb.enabled = !state.reverb.enabled
    initAudio()
  })
  document.body.appendChild(view)
}

function setVibrato (rate, ampl) {
  if (rate || ampl) {
    clearInterval(state.vibrato.interval)
    state.vibrato.rate = rate
    state.vibrato.amplitude = ampl
    state.vibrato.interval = setInterval(vibrato, state.vibrato.rate)
  } else if (state.viewEls.toggleVibrato.checked) {
    state.vibrato.interval = setInterval(vibrato, state.vibrato.rate)
  } else {
    clearInterval(state.vibrato.interval)
  }
}

function setBackround (x, y) {
  view.style.background = `hsla(${x}, ${y}%, 50%, 1)`
}

function step (e) {
  const activeScale = state.currentScale
    .filter(note => !note.disabled)
    .map(note => note.name)
  const vol = (-1 * e.clientY / window.innerHeight) + 1
  state.gain.gain.value = state.oscillator.type === 'sine' ||
  state.oscillator.type === 'triangle'
    ? vol
    : vol / 10
  const freq = (e.clientX / window.innerWidth * 440) + 100
  const curNote = state.clampToNote
    ? state.curNotes.reduce((acc, cur) => {
      const isNatural = cur.note.length === 2
      if (Array.isArray(acc)) {
        if (activeScale.indexOf(cur.note.substr(0, (isNatural ? 1 : 2))) !==
          -1 && cur.frequency < freq) {
          acc.push(cur)
        }
        if (activeScale.indexOf(cur.note.substr(0, (isNatural ? 1 : 2))) !==
          -1 && cur.frequency > freq) {
          acc = acc[acc.length - 1]
        }
      }
      return acc
    }, [])
    : { frequency: freq, note: 'n/a' }
  state.oscillator.frequency.value = curNote.frequency
  state.viewEls.noteDisplay.innerHTML = `Current note: ${curNote.note}`
  setBackround(240 + (e.clientX / window.innerWidth * 100), vol * 100)
  /**
   * rAF Makes Chrome sound terrible.
   */
  // window.requestAnimationFrame(step.bind(null, e))
}

function vibrato () {
  state.oscillator.detune.value = state.oscillator.detune.value + state.vibrato.val
  if (Math.abs(state.vibrato.val) > state.vibrato.amplitude) {
    state.vibrato = {
      ...state.vibrato,
      dir: state.vibrato.dir * -1,
      val: state.vibrato.val - (state.vibrato.dir * 1)
    }
  } else {
    state.vibrato.val = state.vibrato.val + (state.vibrato.dir * 1)
  }
}

// function tremolo () {
//   state.gain.value = state.tremolo.val
// }

(function theremin () {
  getNotes()
  initView()
  document.addEventListener('mousemove', step)
  document.addEventListener('touchmove', step)
})()

if (module.hot) {
  module.hot.accept()
}
