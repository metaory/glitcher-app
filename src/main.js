import gradientGL from 'gradient-gl'
import { downloader } from './save.js'
import createGlitchEffect from './glitch.js'
import '../public/style.css'

gradientGL('a2.bf6a')

const $ = document.getElementById.bind(document)
const query = document.querySelector.bind(document)
const parse = (el) => Number.parseFloat(el.value)

const updatePreview = (e) => {
  if (e?.target?.type === 'range') {
    e.target.setAttribute('value', e.target.value)
    e.preventDefault()
    e.stopPropagation()
  }
  
  const text = $('textInput').value || 'ḠĿ𐪌𐌕ꛕ𖩘꠵ⵤ'
  const params = {
    speed: parse($('speed')),
    intensity: parse($('intensity')),
    colorSep: parse($('colorSep')),
    heightVariation: parse($('slices'))
  }
  
  $('preview').innerHTML = createGlitchEffect(text, params)
}

for (const id of ['textInput', 'speed', 'intensity', 'colorSep', 'slices']) {
  $(id).addEventListener('input', updatePreview)
}

$('download').onclick = () => downloader.svg(query('#preview svg'))
// $('downloadWebm').onclick = () => downloader.webm(query('#preview svg'))

$('version').textContent = `v${import.meta.env.VERSION}`
updatePreview()
