const createBlob = (data, type) => new Blob([data], { type })

const createUrl = (blob) => URL.createObjectURL(blob)

const download = (blob, filename) => {
  const url = createUrl(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a).click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const formats = {
  svg: (svg) => {
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = createBlob(svgData, 'image/svg+xml')
    download(blob, `glitch_${~~performance.now()}.svg`)
  },
  // webm: (svg, options = {}) => capture(svg, options.duration || 2000, options)
}

export const downloader = {
  svg: (svg) => formats.svg(svg),
  // webm: (svg, options) => formats.webm(svg, options)
} 