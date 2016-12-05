import fetch from 'isomorphic-fetch'
import * as styles from './app.css'
import reverb from 'arraybuffer!./AbernyteGrainSilo.m4a'

/**
 * Audio.
 */
const audioCtx = new window.AudioContext()

/**
 * App state.
 */
const state = {
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
  waves: [
    'sine',
    'square',
    'sawtooth',
    'triangle'
  ],
  overlayVisible: true,
  view: document.createElement('div'),
  vibrato: { dir: 1, val: 1, rate: 10, amplitude: 5, interval: () => {} }
}

/**
 * Audio.
 */
function initAudio (shouldDisconnect) {
  audioCtx.decodeAudioData(reverb)
  .then((data) => {
    if (shouldDisconnect) {
      state.convolver.disconnect(state.gain)
    }
    state.convolver.buffer = data
    state.convolver.connect(state.gain)
    state.oscillator.connect(state.gain)
    state.gain.connect(audioCtx.destination)
    state.oscillator.frequency.value = 0
    state.oscillator.start()
  })
}

/**
 * Fetch frequency data.
 */
function getNotes () {
  fetch('/src/music-freqs.json')
  .then((resp) => {
    return resp.json()
  })
  .then((resp) => {
    state.curNotes = resp
  })
}

/**
 * View.
 */
const noteDisplay = document.createElement('p')
const allowedNotes = document.createElement('form')
const controls = document.createElement('div')
const clampOption = document.createElement('div')
const toggleSnapToNote = document.createElement('input')
const waves = document.createElement('select')
const bufferSrc = document.createElement('form')
const bufferInput = document.createElement('input')
const bufferSubmit = document.createElement('button')
const vibratoSettings = document.createElement('form')
const shouldUseVibrato = document.createElement('input')
const vibratoRateInput = document.createElement('input')
const vibratoAmplitubeInput = document.createElement('input')

// Overlay
const overlay = document.createElement('div')
overlay.innerHTML = `Heads up! This thing makes noise. It shouldn't be too loud, but consider turning down your speakers or headphones just in case. Click anywhere to begin.`
overlay.classList.add(styles.overlay)
state.view.appendChild(overlay)

// Controls
state.currentScale.map((note, idx) => {
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
.forEach((node) => {
  allowedNotes.appendChild(node)
})
toggleSnapToNote.type = 'checkbox'
clampOption.innerHTML = 'Clamp to note?'
bufferInput.placeholder = 'Custom buffer source'
bufferSubmit.innerHTML = 'Get'
bufferSrc.appendChild(bufferInput)
bufferSrc.appendChild(bufferSubmit)
vibratoRateInput.type = 'number'
vibratoRateInput.value = state.vibrato.rate
vibratoAmplitubeInput.type = 'number'
vibratoAmplitubeInput.value = state.vibrato.amplitude
shouldUseVibrato.type = 'checkbox'
vibratoSettings.appendChild(shouldUseVibrato)
vibratoSettings.appendChild(vibratoRateInput)
vibratoSettings.appendChild(vibratoAmplitubeInput)
clampOption.appendChild(toggleSnapToNote)
controls.appendChild(clampOption)
controls.appendChild(waves)
controls.appendChild(bufferSrc)
controls.appendChild(vibratoSettings)
noteDisplay.classList.add(styles.currentNote)
controls.appendChild(noteDisplay)
allowedNotes.classList.add(styles.notes)
controls.appendChild(allowedNotes)
controls.classList.add(styles.controls)
state.view.appendChild(controls)
waves.innerHTML = state.waves.map((wave) => {
  return `<option value="${wave}">${wave}</option>`
}).join('')

/**
 * Events.
 */
overlay.addEventListener('click', (e) => {
  e.target.remove()
  initAudio()
})
waves.addEventListener('click', (e) => {
  state.gain.gain.value = 0
})
waves.addEventListener('change', (e) => {
  state.oscillator.type = e.target.value
})
toggleSnapToNote.addEventListener('click', (e) => {
  state.clampToNote = !state.clampToNote
})
allowedNotes.addEventListener('submit', (e) => {
  e.preventDefault()
})
bufferSrc.addEventListener('submit', (e) => {
  e.preventDefault()
  // setBuffer(state.convolver, bufferInput.value)
})

function setVibrato (rate, ampl) {
  if (rate || ampl) {
    clearInterval(state.vibrato.interval)
    state.vibrato.rate = rate
    state.vibrato.amplitude = ampl
    state.vibrato.interval = setInterval(vibrato, state.vibrato.rate)
  } else if (shouldUseVibrato.checked) {
    state.vibrato.interval = setInterval(vibrato, state.vibrato.rate)
  } else {
    clearInterval(state.vibrato.interval)
  }
}
shouldUseVibrato.addEventListener('click', () => {
  setVibrato()
})
vibratoRateInput.addEventListener('change', () => {
  setVibrato(setVibrato(vibratoRateInput.value))
})

vibratoAmplitubeInput.addEventListener('change', () => {
  setVibrato(state.vibrato.rate, vibratoRateInput.value)
})

function setBackround (x, y) {
  state.view.style.background = `hsla(${x}, ${y}%, 50%, 1)`
}

function step (e) {
  const activeScale = state.currentScale.filter(note => !note.disabled).map(note => note.name)
  const vol = (-1 * e.clientY / window.innerHeight) + 1
  state.gain.gain.value = state.oscillator.type === 'sine' || state.oscillator.type === 'triangle'
    ? vol
    : vol / 10
  const freq = (e.clientX / window.innerWidth * 440) + 100
  const curNote = state.clampToNote ? state.curNotes.reduce((acc, cur) => {
    const isNatural = cur.note.length === 2
    if (Array.isArray(acc)) {
      if (activeScale.indexOf(cur.note.substr(0, (isNatural ? 1 : 2))) !== -1 && cur.frequency < freq) {
        acc.push(cur)
      }
      if (activeScale.indexOf(cur.note.substr(0, (isNatural ? 1 : 2))) !== -1 && cur.frequency > freq) {
        acc = acc[acc.length - 1]
      }
    }
    return acc
  }, [])
    : { frequency: freq, note: 'n/a' }
  state.oscillator.frequency.value = curNote.frequency
  noteDisplay.innerHTML = `Current note: ${curNote.note}`
  setBackround(240 + (e.clientX / window.innerWidth * 100), vol * 100)
  /**
   * rAF Makes Chrome sound terrible.
   */
  // window.requestAnimationFrame(step.bind(null, e))
}

function vibrato () {
  state.oscillator.detune.value = state.oscillator.detune.value + state.vibrato.val
  if (Math.abs(state.vibrato.val) > state.vibrato.amplitude) {
    state.vibrato = { ...state.vibrato, dir: state.vibrato.dir * -1, val: state.vibrato.val - (state.vibrato.dir * 1) }
  } else {
    state.vibrato.val = state.vibrato.val + (state.vibrato.dir * 1)
  }
}

(function theremin () {
  getNotes()
  state.view.classList.add(styles.theremin)
  document.body.appendChild(state.view)
  document.addEventListener('mousemove', step)
})()

if (module.hot) {
  module.hot.accept()
}
