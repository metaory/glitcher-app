import captureAnimatedSVG from './webm.js'

const download = (blob, ext) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `glitch_${~~performance.now()}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export const downloader = {
  svg: (svg) =>
    download(
      new Blob([new XMLSerializer().serializeToString(svg)], {
        type: 'image/svg+xml;charset=utf-8',
      }),
      'svg',
    ),
  webm: async (svg, btn) => {
    const origText = btn.textContent
    btn.disabled = true
    btn.textContent = 'Converting...'
    try {
      const blob = await captureAnimatedSVG(svg)
      download(blob, 'webm')
    } catch (err) {
      console.error('>>', err)
    } finally {
      btn.disabled = false
      btn.textContent = origText
    }
  },
}
