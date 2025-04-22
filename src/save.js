import { downloadSvg } from './svg.js'
import { captureAnimatedSVG } from './webm.js'

const createDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a).click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const downloader = {
  svg: downloadSvg,
  webm: async (svg) => {
    const blob = await captureAnimatedSVG(svg)
    createDownload(blob, `glitch_${~~performance.now()}.webm`)
  }
}
