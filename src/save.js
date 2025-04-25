import captureAnimatedSVG from './webm.js'
// import captureAnimatedGIF from './gif.js'

const createDownloadURL = blob => URL.createObjectURL(blob)

const triggerDownload = (url, ext) => {
  const a = document.createElement('a')
  a.href = url
  a.download = `glitch_${~~performance.now()}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

const withLoadingState = async (btn, action) => {
  const origText = btn.textContent
  btn.disabled = true
  try {
    const updateProgress = progress => {
      const text = progress ? `${(progress * 100).toFixed()}%` : 'Saving...'
      btn.textContent = text
    }
    return await action(updateProgress)
  } catch (err) {
    console.error(`${btn.id} capture failed:`, err)
  } finally {
    btn.disabled = false
    btn.textContent = origText
    console.log('blur')
    btn.blur()
  }
}

const createDownloader = (capture, ext) => async (svg, btn) => {
  const blob = await withLoadingState(btn, 
    capture ? progress => capture(svg, progress) : 
    () => new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8'
    })
  )
  blob && triggerDownload(createDownloadURL(blob), ext)
}

export const downloader = {
  svg: createDownloader(null, 'svg'),
  webm: createDownloader(captureAnimatedSVG, 'webm'),
  gif: createDownloader(captureAnimatedSVG, 'gif')
}
