const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const createVisibleContainer = (svg, width, height) => {
  const container = document.createElement('div')
  container.id = 'recording-preview'
  container.style.position = 'fixed'
  container.style.top = '10px'
  container.style.right = '10px'
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.zIndex = '9999'
  container.style.backgroundColor = '#000'
  container.style.border = '1px solid #fff'
  
  container.innerHTML = svg.outerHTML
  const svgElement = container.querySelector('svg')
  svgElement.style.width = '100%'
  svgElement.style.height = '100%'
  
  document.body.appendChild(container)
  
  return {
    element: container,
    cleanup: () => document.body.removeChild(container)
  }
}

const captureFrame = (container, canvas) => {
  const ctx = canvas.getContext('2d')
  
  if (window.html2canvas) {
    return window.html2canvas(container).then(renderedCanvas => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(renderedCanvas, 0, 0, canvas.width, canvas.height)
      return true
    })
  }
  
  return new Promise(resolve => {
    try {
      const svgElement = container.querySelector('svg')
      const svgString = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(true)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(false)
      }
      
      img.src = url
    } catch (err) {
      resolve(false)
    }
  })
}

const createRecorder = (canvas) => {
  const fps = 30
  const stream = canvas.captureStream(fps)
  const codecs = ['video/webm;codecs=vp8', 'video/webm']
  const mimeType = codecs.find(type => MediaRecorder.isTypeSupported(type))
  
  return new MediaRecorder(stream, {
    mimeType: mimeType || undefined,
    videoBitsPerSecond: 5000000
  })
}

const recordAnimation = (container, canvas, duration) => {
  return new Promise((resolve, reject) => {
    const recorder = createRecorder(canvas)
    const chunks = []
    const startTime = performance.now()
    let frameCount = 0
    
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error('No video data captured'))
        return
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
    }
    
    recorder.onerror = reject
    
    recorder.start(1000)
    
    const captureFrames = async () => {
      const success = await captureFrame(container, canvas)
      if (success) frameCount++
      
      const elapsed = performance.now() - startTime
      
      if (elapsed < duration) {
        requestAnimationFrame(captureFrames)
      } else {
        recorder.stop()
      }
    }
    
    captureFrames()
  })
}

export const captureAnimatedSVG = async (svg) => {
  const scale = 2
  let width = Number.parseInt(svg.getAttribute('width') || svg.viewBox?.baseVal?.width || 600, 10)
  let height = Number.parseInt(svg.getAttribute('height') || svg.viewBox?.baseVal?.height || 100, 10)
  
  width = Math.max(width * scale, 320)
  height = Math.max(height * scale, 100)
  
  const { element, cleanup } = createVisibleContainer(svg, width, height)
  const canvas = createCanvas(width, height)
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const duration = 10000
    const blob = await recordAnimation(element, canvas, duration)
    return blob
  } finally {
    cleanup()
  }
} 