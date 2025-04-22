import gradientGL from 'gradient-gl'
import '../public/style.css'

gradientGL('a2.bf6a')

const $ = document.getElementById.bind(document)
const parse = (el) => Number.parseFloat(el.value)

const colorMatrices = {
  red: '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0',
  green: '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0',
  blue: '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0',
}

const createKeyTimes = (steps = 8) =>
  [0, ...Array.from({ length: steps - 2 }, () => Math.random() * 0.92 + 0.08)
    .sort((a, b) => a - b), 1].join(';')

const createValues = (max, steps = 8) =>
  Array.from({ length: steps }, () => Math.random() * (max - 0.001) + 0.001).join(';')

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

const measureText = (text) => {
  const span = Object.assign(document.createElement('span'), {
    style: `
      font-family: monospace, serif;
      font-weight: bolder;
      font-size: 24px;
      visibility: hidden;
      position: absolute;
      white-space: nowrap;
      letter-spacing: 0.1em;
    `,
    textContent: text
  })
  document.body.appendChild(span)
  const width = span.getBoundingClientRect().width
  document.body.removeChild(span)
  return width
}

const calculateDimensions = (text) => {
  const textWidth = measureText(text)
  console.log('Text width:', textWidth)
  
  const padding = Math.max(1, textWidth * 0.005)
  const buffer = Math.min(8, textWidth * 0.02)
  const width = textWidth + padding * 2 + buffer
  
  return {
    width: Math.max(100, width),
    height: 48,
    verticalPadding: 12,
    fontSize: 24
  }
}

const calculateSliceDurations = (speed, normalizedHeights) => 
  normalizedHeights.map(height => {
    let duration
    if (speed < 3) {
      duration = 300 - (speed * 80)
    } else if (speed < 7) {
      duration = 60 * (0.3 ** (speed - 3))
    } else {
      duration = 20 * (0.2 ** (speed - 7))
    }
    
    const heightVariation = 1 + (height / 100)
    const randomVariation = 0.8 + Math.random() * 0.4
    return Number(Math.max(0.05, duration * heightVariation * randomVariation).toFixed(2))
  })

const createGlitchEffect = (text, params) => {
  const { width, height, verticalPadding, fontSize } = calculateDimensions(text)
  const { speed, intensity, colorSep, heightVariation } = params

  const sliceHeights = Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * (6 + heightVariation * 2 - 6) + 6))
  
  const totalHeight = sliceHeights.reduce((sum, h) => sum + h, 0)
  const normalizedHeights = sliceHeights.map(h => 
    Math.max(6, Math.round((h / totalHeight) * 100)))
  
  const currentTotal = normalizedHeights.reduce((sum, h) => sum + h, 0)
  normalizedHeights[normalizedHeights.length - 1] += 100 - currentTotal

  const sliceYs = normalizedHeights.map((_, i) =>
    normalizedHeights.slice(0, i).reduce((sum, h) => sum + h, 0))

  const sliceDurations = calculateSliceDurations(speed, normalizedHeights)
  const slices = normalizedHeights.map((height, i) =>
    createSlice(i, sliceYs[i], height, sliceDurations[i], intensity))

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
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}">
      <text filter="url(#glitch)" fill="#FFFFFF" font-family="monospace, serif" 
            font-weight="bolder" font-size="${fontSize}" text-anchor="middle" 
            dominant-baseline="middle" x="50%" y="50%">${text}</text>
      <defs>
        <filter id="glitch" primitiveUnits="objectBoundingBox" x="-10%" y="0%" width="120%" height="100%">
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
