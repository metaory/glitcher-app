import '@fontsource/bungee'
import '@fontsource/libre-barcode-128-text'
import gradientGL from 'gradient-gl'
import { downloader } from './save.js'
import createGlitchEffect from './glitch.js'
import './style.css'
import { createCanvas } from './svgcap.js'

gradientGL('a2.af4a')

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

const state = new Proxy({ img: null }, {
  set(obj, prop, val) {
    obj[prop] = val
    updatePreview()
    return true
  }
})

const downscale = (file, maxDim = 512) => new Promise(res => {
  const img = new window.Image()
  img.onload = () => {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = createCanvas({ width: w, height: h })
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    res({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h })
  }
  img.src = URL.createObjectURL(file)
})

$('imgInput').onchange = e => {
  const file = e.target.files[0]
  if (file) {
    downscale(file, 512).then(({ dataUrl, width, height }) => {
      state.img = dataUrl
      state.imgWidth = width
      state.imgHeight = height
    })
  } else {
    state.img = null
    state.imgWidth = null
    state.imgHeight = null
  }
  $('textInput').value = ''
}

$('textInput').addEventListener('input', e => {
  if (state.img) state.img = null
})

const renderImage = src => `<img src="${src}" alt="glitch-img" style="max-width:100%;max-height:320px;border-radius:1.2em;border:4px solid #fc4a;" />`

const updatePreview = (e) => {
  if (e?.target?.type === 'range') {
    updateValue(e)
    $('textInput').blur()
  }
  const isImg = !!state.img
  $('preview').innerHTML = createGlitchEffect({
    text: isImg ? '' : getText(),
    img: state.img || null,
    imgWidth: isImg ? state.imgWidth : undefined,
    imgHeight: isImg ? state.imgHeight : undefined
  }, getParams())
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
