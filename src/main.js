import gradientGL from 'gradient-gl'
import '../public/style.css'

gradientGL('a2.bf7c')

const $ = document.getElementById.bind(document)
const $$ = document.querySelector.bind(document)
const $$$ = document.querySelectorAll.bind(document)
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.floor(rand(min, max))
const parse = (el) => Number.parseFloat(el.value)

const createKeyTimes = (steps = 8) =>
  [0, ...Array.from({ length: steps - 2 }, () => rand(0.08, 1)).sort((a, b) => a - b), 1].join(';')

const createValues = (max, steps = 8) =>
  Array.from({ length: steps }, () => rand(0.001, max)).join(';')

const createSlice = (i, y, height, duration, intensity) => {
  const values = createValues(intensity)
  const keyTimes = createKeyTimes()
  return `
    <feOffset in="blended" dx="0" dy="0" y="${y}%" height="${height}%" result="slice_${i}">
      <animate attributeName="dx" keyTimes="${keyTimes}" values="${values}" 
               begin="0s" dur="${duration}s" calcMode="discrete" repeatCount="indefinite" fill="freeze" />
      <animate attributeName="dy" keyTimes="${keyTimes}" values="${values}" 
               begin="0s" dur="${duration}s" calcMode="discrete" repeatCount="indefinite" fill="freeze" />
    </feOffset>
  `
}

const colorMatrices = {
  red: '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0',
  green: '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0',
  blue: '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0',
}

const createGlitchEffect = (text) => {
  const width = text.length * 17
  const [speed, intensity, colorSep, heightVariation] = [
    'speed',
    'intensity',
    'colorSep',
    'slices',
  ].map((id) => parse($(id)))

  const sliceHeights = Array.from({ length: 8 }, () => randInt(6, 6 + heightVariation * 2))

  const sliceDurations = sliceHeights.map(() => speed * (0.8 + Math.random() * 0.4))

  const sliceYs = sliceHeights.map((_, i) =>
    sliceHeights.slice(0, i).reduce((sum, h) => sum + h, 0),
  )

  const slices = sliceHeights.map((height, i) =>
    createSlice(i, sliceYs[i], height, sliceDurations[i], intensity),
  )

  const colorMatrix = (channel) => `
    <feColorMatrix in="SourceGraphic" result="${channel}" type="matrix" 
                   values="${colorMatrices[channel]}" />
  `

  const colorOffset = (channel, dx, dur) => {
    const keyTimes = createKeyTimes()
    const values = createValues(colorSep)
    return `
      <feOffset in="${channel}" result="${channel}-shifted" dx="${dx}" dy="0">
        <animate attributeName="dx" keyTimes="${keyTimes}" values="${values}" 
                 begin="0" dur="${dur}s" calcMode="discrete" repeatCount="indefinite" fill="freeze" />
        <animate attributeName="dy" keyTimes="${keyTimes}" values="${values}" 
                 begin="0" dur="${dur}s" calcMode="discrete" repeatCount="indefinite" fill="freeze" />
      </feOffset>
    `
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 32">
      <text filter="url(#glitch)" fill="#FFFFFF" font-family="monospace, serif" 
            font-weight="bolder" font-size="x-large" text-anchor="middle" 
            lengthAdjust="spacingAndGlyphs" textLength="70%" 
            dominant-baseline="mathematical" x="50%" y="30%">${text}</text>
      <defs>
        <filter id="glitch" primitiveUnits="objectBoundingBox" x="0%" y="0%" height="100%">
          ${Object.keys(colorMatrices).map(colorMatrix).join('')}
          ${colorOffset('red', -0.01, speed)}
          ${colorOffset('blue', 0.01, speed * 1.1)}
          <feBlend mode="screen" in="red-shifted" in2="green" result="red-green" />
          <feBlend mode="screen" in="red-green" in2="blue-shifted" result="blended" />
          ${slices.join('')}
          <feMerge>
            ${slices.map((_, i) => `<feMergeNode in="slice_${i}" />`).join('')}
          </feMerge>
        </filter>
      </defs>
    </svg>
  `
}

const updatePreview = (el) => {
  const text = $('textInput').value || 'GLITCH'
  $('preview').innerHTML = createGlitchEffect(text)
}

const downloadSVG = () => {
  const svg = $('preview').querySelector('svg')
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'glitch.svg'
  document.body.appendChild(a).click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

for (const id of ['textInput', 'speed', 'intensity', 'colorSep', 'slices']) {
  $(id).addEventListener('input', updatePreview)
}

$('download').addEventListener('click', downloadSVG)

$('version').textContent = `v${import.meta.env.VERSION}`

updatePreview()
