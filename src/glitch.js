const colorMatrices = {
  red: '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0',
  green: '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0',
  blue: '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0',
}

const createKeyTimes = (steps = 8) =>
  [
    0,
    ...Array.from({ length: steps - 2 }, () => (Math.random() * 0.92 + 0.08).toFixed(4)).sort(
      (a, b) => a - b,
    ),
    1,
  ].join(';')

const createValues = (max, steps = 8) =>
  Array.from({ length: steps }, () => (Math.random() * (max - 0.001) + 0.001).toFixed(4)).join(';')

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
    textContent: text,
  })
  document.body.appendChild(span)
  const width = span.getBoundingClientRect().width
  document.body.removeChild(span)
  return width
}

const calculateDimensions = (text) => {
  const textWidth = measureText(text)

  const padding = textWidth * 0.02
  const width = textWidth + padding * 2

  const scale = 2.5

  return {
    width: Math.max(50, width) * scale,
    height: 48 * scale,
    fontSize: 26 * scale,
  }
}

const calculateSliceDurations = (speed, normalizedHeights) => {
  const baseDuration =
    speed < 3 ? 300 - speed * 80 : speed < 7 ? 60 * 0.3 ** (speed - 3) : 20 * 0.2 ** (speed - 7)

  return normalizedHeights.map((height) => {
    const variation = (1 + height / 100) * (0.8 + Math.random() * 0.4)
    return Math.max(0.05, (baseDuration * variation).toFixed(4))
  })
}

export default (input, params) => {
  const isImg = !!input.img
  const text = input.text
  const img = input.img
  const { speed, intensity, colorSep, heightVariation } = params

  // For text, measure and size as before
  // For image, use fixed or intrinsic size, or fallback
  const dims = isImg
    ? { width: 420, height: 120, fontSize: 0 } // TODO: optionally infer from image
    : calculateDimensions(text)
  const { width, height, fontSize } = dims

  const sliceHeights = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * (6 + heightVariation * 2 - 6) + 6),
  )
  const totalHeight = sliceHeights.reduce((sum, h) => sum + h, 0)
  const normalizedHeights = sliceHeights.map((h) =>
    Math.max(6, Math.round((h / totalHeight) * 100)),
  )
  const currentTotal = normalizedHeights.reduce((sum, h) => sum + h, 0)
  normalizedHeights[normalizedHeights.length - 1] += 100 - currentTotal
  const sliceYs = normalizedHeights.map((_, i) =>
    normalizedHeights.slice(0, i).reduce((sum, h) => sum + h, 0),
  )
  const sliceDurations = calculateSliceDurations(speed, normalizedHeights)
  const slices = normalizedHeights.map((height, i) =>
    createSlice(i, sliceYs[i], height, sliceDurations[i], intensity),
  )
  const colorMatrix = (channel) => `      <feColorMatrix 
  in="SourceGraphic" result="${channel}" type="matrix" values="${colorMatrices[channel]}" /> `
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
  return `<svg xmlns="http://www.w3.org/2000/svg" 
            width="${Math.round(width)}px" 
            height="${height}px" 
            viewBox="0 0 ${Math.round(width)} ${height}">
  <!-- made with glitcher-app v${import.meta.env.VERSION} -->
  <!-- https://github.com/metaory/glitcher-app -->
  <!-- MIT License (c) 2025 metaory -->
  ${isImg
    ? `<image href="${img}" x="0" y="0" width="100%" height="100%" filter="url(#glitch)" style="image-rendering:pixelated;" />`
    : `<text
    filter="url(#glitch)" 
    fill="#FFFFFF" 
    font-family="Arial Black, Impact, Arial, monospace, system-ui"
    font-weight="bolder" 
    font-size="${fontSize}" 
    text-anchor="middle" 
    dominant-baseline="middle" 
    x="48%" 
    y="50%"
  >${text}</text>`}
  <defs>
    <filter id="glitch" primitiveUnits="objectBoundingBox" x="-10%" y="0%" width="120%" height="100%">
${Object.keys(colorMatrices).map(colorMatrix).join('\n')}
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
  `.replace(/\n\s*\n/g, '\n')
}
