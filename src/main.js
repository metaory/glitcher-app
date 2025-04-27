import '@fontsource/bungee'
import '@fontsource/libre-barcode-128-text'
import gradientGL from 'gradient-gl'
import { downloader } from './save.js'
import createGlitchEffect from './glitch.js'
import './style.css'

gradientGL('a2.fc4a')

const $ = document.getElementById.bind(document)
const query = document.querySelector.bind(document)
const parse = Number.parseFloat

const updateValue = (e) => {
  const span = e.target.previousElementSibling?.querySelector('span')
  if (span) span.textContent = e.target.value
}

const getText = () => $('textInput').value || 'ḠĿ𐪌𐌕ꛕ𖩘꠵ⵤ'
const getParams = () => ({
  speed: parse($('speed').value),
  intensity: parse($('intensity').value),
  colorSep: parse($('colorSep').value),
  heightVariation: parse($('slices').value),
})

const updatePreview = (e) => {
  if (e?.target?.type === 'range') {
    updateValue(e)
    $('textInput').blur()
  }
  $('preview').innerHTML = createGlitchEffect(getText(), getParams())
}

const updateRangeLabels = () => {
  for (const input of document.querySelectorAll('input[type="range"]')) {
    const label = document.createElement('div')
    label.className = 'range-label'
    label.textContent = `${input.title}: ${input.value}`
    input.parentNode.insertBefore(label, input)
  }
}

for (const id of ['textInput', 'speed', 'intensity', 'colorSep', 'slices']) {
  $(id).addEventListener('input', updatePreview)
}

const setupDownloaders = (ext) => {
  const btn = $(`download-${ext}`)
  btn.onclick = () => downloader[ext](query('#preview svg'), btn)
}

;['webm', 'svg', 'gif'].forEach(setupDownloaders)

$('version').textContent = `v${import.meta.env.VERSION}`

updatePreview()
