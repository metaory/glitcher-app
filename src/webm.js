const maxDuration = 10000 // 10s
const fps = 60

export default (svg) => new Promise((resolve) => {
  const canvas = document.createElement('canvas')
  canvas.width = svg.width.baseVal.value
  canvas.height = svg.height.baseVal.value
  const ctx = canvas.getContext('2d')

  const stream = canvas.captureStream(fps)
  const chunks = []
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })

  recorder.ondataavailable = e => chunks.push(e.data)
  recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))

  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg)
  )}`

  const interval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }, 1000 / fps)

  recorder.start()

  setTimeout(() => {
    clearInterval(interval)
    recorder.stop()
  }, maxDuration)
})
