import encodeWebm from './webm.js'
import encodeGif from './gif.js'

const createDownloadURL = blob => URL.createObjectURL(blob)

const triggerDownload = (url, ext) => {
  const a = document.createElement('a')
  a.href = url
  a.download = `glitch_${~~performance.now()}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

const formatters = {
  percentage: progress => `${(progress * 100).toFixed()}%`,
  timer: seconds => `${seconds.toFixed(1)}s`
}

const createProgressStrategy = (btn) => ({
  percentage: () => {
    const update = progress => {
      btn.textContent = formatters.percentage(progress)
    }
    return { update, cleanup: () => {} }
  },
  timer: () => {
    let time = 0
    const intervalId = setInterval(() => {
      time += 0.1
      btn.textContent = formatters.timer(time)
    }, 100)
    return {
      update: () => {}, // No-op for timer strategy
      cleanup: () => clearInterval(intervalId)
    }
  }
})

const withLoadingState = async (btn, action, progressType = 'percentage') => {
  const origText = btn.textContent
  btn.disabled = true
  
  const strategy = createProgressStrategy(btn)[progressType]()
  
  try {
    return await action(strategy.update)
  } catch (err) {
    console.error(`${btn.id} capture failed:`, err)
    return null
  } finally {
    strategy.cleanup()
    btn.disabled = false
    btn.textContent = origText
    console.log('blur')
    btn.blur()
  }
}

const captureSVG = (svg, progress) => {
  progress(1)
  return Promise.resolve(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8'
    })
  )
}

const createDownloader = (captureFunc, ext, progressType = 'percentage') => async (svg, btn) => {
  const blob = await withLoadingState(btn, progress => captureFunc(svg, progress), progressType)
  blob && triggerDownload(createDownloadURL(blob), ext)
}

export const downloader = {
  svg: createDownloader(captureSVG, 'svg'),
  webm: createDownloader(encodeWebm, 'webm'),
  gif: createDownloader(encodeGif, 'gif', 'timer')
}