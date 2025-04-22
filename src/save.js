import { captureAnimatedSVG } from './webm.js'

const svgToBlob = (svg) => {
  const svgData = new XMLSerializer().serializeToString(svg)
  return new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
}

const createDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a).click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadSvg = (svg) => {
  const blob = svgToBlob(svg)
  createDownload(blob, `glitch_${~~performance.now()}.svg`)
}

export const downloader = {
  svg: downloadSvg,
  webm: async (svg) => {
    const blob = await captureAnimatedSVG(svg)
    createDownload(blob, `glitch_${~~performance.now()}.webm`)
  }
}
