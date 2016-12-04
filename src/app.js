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
  currentScale: [{name: 'c', disabled: false}, {name: 'c#', disabled: false}, {name: 'd', disabled: false}, { name: 'd#', disabled: false}, {name: 'e', disabled: false}, {name: 'f', disabled: false}, {name: 'f#', disabled: false}, {name: 'g', disabled: false}, {name: 'g#', disabled: false}, {name: 'a', disabled: false}, {name: 'a#', disabled: false}, {name: 'b', disabled: false}],
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
  wobble: { dir: 1, val: 1 }
}

/**
 * Audio.
 */
function initAudio () {
	// const reverb = Reverb(audioCtx)
  audioCtx.decodeAudioData(reverb)
		.then((data) => {
  console.log(data)
  state.convolver.buffer = data
  state.convolver.connect(state.gain)
  state.oscillator.connect(state.convolver)
			// reverb.connect(state.gain)
		  state.gain.connect(audioCtx.destination)
		  state.oscillator.frequency.value = 0
		  state.oscillator.start()
})
}

/**
 * Fetch frequency data.
 */
function getNotes () {
  fetch('https://s3-us-west-2.amazonaws.com/s.cdpn.io/4893/music-freqs-lower.json')
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
const controls = document.createElement('form')
const clampOption = document.createElement('div')
const toggleSnapToNote = document.createElement('input')
const waves = document.createElement('select')

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
clampOption.appendChild(toggleSnapToNote)
controls.appendChild(clampOption)
controls.appendChild(waves)
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

function setBackround (x, y) {
  state.view.style.background = `hsla(${x}, ${y}%, 50%, 1)`
}

function step (e) {
  const activeScale = state.currentScale.filter(note => !note.disabled).map(note => note.name)
  const vol = (-1 * e.clientY / window.innerHeight) + 1
  state.gain.gain.value = state.oscillator.type === 'sine' || state.oscillator.type === 'triangle' ?
     vol :
    vol / 10
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
  }, []) :
    { frequency: freq, note: 'n/a' }
  state.oscillator.frequency.value = curNote.frequency
  noteDisplay.innerHTML = `Current note: ${curNote.note}`
  setBackround(240 + (e.clientX / window.innerWidth * 100), vol * 100)
  /**
   * rAF Makes Chrome sound terrible.
   */
  // window.requestAnimationFrame(step.bind(null, e))
}

function wobble () {
  state.oscillator.detune.value = state.wobble.dir === -1 ?
    state.oscillator.detune.value - state.wobble.val :
    state.oscillator.detune.value + state.wobble.val
  if (Math.abs(state.wobble.val) > 5) {
    state.wobble = { dir: state.wobble.dir * -1, val: state.wobble.val - (state.wobble.dir * 1) }
  } else {
    state.wobble.val = state.wobble.val + (state.wobble.dir * 1)
  }
}

(function theremin () {
  getNotes()
  state.view.classList.add(styles.theremin)
  document.body.appendChild(state.view)
  // setInterval(wobble, 10)
  document.addEventListener('mousemove', step)
})()

if (module.hot) {
  module.hot.accept()
}
