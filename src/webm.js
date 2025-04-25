const CONFIG = {
    fps: 30,
    duration: 10,
    quality: 2_000_000,
    codec: 'video/webm;codecs=vp9',
    options: {
        maxBitrate: 2_400_000,
        minBitrate: 1_200_000,
        maxQuantizer: 56,
        minQuantizer: 20
    }
}

const log = (msg, ...args) => {
    const time = (performance.now() / 1000).toFixed(1)
    console.log(`[WebM ${time}s]`, msg, ...args)
}

const getSVGDimensions = svg => ({
    width: svg.getAttribute('viewBox')?.split(' ')[2] || svg.width.baseVal.value,
    height: svg.getAttribute('viewBox')?.split(' ')[3] || svg.height.baseVal.value
})

const createCanvas = ({width, height}) => {
    width = Math.floor(width / 2) * 2
    height = Math.floor(height / 2) * 2
    return Object.assign(document.createElement('canvas'), {width, height})
}

const updateAnimationState = (svg, time) => {
    const svgCopy = svg.cloneNode(true)
    for (const anim of svgCopy.querySelectorAll('animate')) {
        const values = anim.getAttribute('values')?.split(';') || []
        if (!values.length) continue
        const targetValue = values[Math.floor(time * (values.length - 1))]
        anim.setAttribute('values', targetValue)
        anim.setAttribute('keyTimes', '0')
    }
    return svgCopy
}

const svgToImage = svg => new Promise(resolve => {
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
    }
    img.src = url
})

const captureState = async (svg, time) => {
    const svgCopy = updateAnimationState(svg, time)
    const canvas = createCanvas(getSVGDimensions(svg))
    const ctx = canvas.getContext('2d', { alpha: true })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const img = await svgToImage(svgCopy)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
}

const initRecorder = stream => {
    const recorder = new MediaRecorder(stream, {
        mimeType: CONFIG.codec,
        videoBitsPerSecond: CONFIG.quality,
        ...CONFIG.options
    })
    const chunks = []
    
    recorder.ondataavailable = e => {
        log(`Data chunk: ${(e.data.size / 1024).toFixed(1)}KB`)
        chunks.push(e.data)
    }
    
    return { recorder, chunks }
}

export default async (svg, onProgress) => {
    const speedControl = document.getElementById('speed')
    const userSpeed = speedControl ? Number(speedControl.value) : 5
    log('User speed setting:', userSpeed)
    
    const cyclesPerSecond = userSpeed / 10
    
    log('Starting recording process', { 
        ...CONFIG, 
        userSpeed,
        cyclesPerSecond: cyclesPerSecond.toFixed(2),
        cycleTimeSeconds: (1 / cyclesPerSecond).toFixed(2)
    })
    
    const firstCanvas = await captureState(svg, 0)
    log('First frame captured', firstCanvas.width, firstCanvas.height)
    
    const stream = firstCanvas.captureStream(CONFIG.fps)
    log('Stream created', stream.id)
    
    const { recorder, chunks } = initRecorder(stream)
    
    return new Promise(resolve => {
        const startTime = performance.now()
        log('Recording started at', startTime)
        
        recorder.start(500)
        
        const renderFrame = async now => {
            const elapsed = (now - startTime) / 1_000
            
            if (elapsed >= CONFIG.duration) {
                log('Duration reached, stopping', elapsed)
                recorder.stop()
                return
            }
            
            const progress = elapsed / CONFIG.duration
            onProgress?.(progress)
            
            const animProgress = (elapsed * cyclesPerSecond) % 1
            const canvas = await captureState(svg, animProgress)
            const ctx = firstCanvas.getContext('2d', { alpha: true })
            ctx.clearRect(0, 0, firstCanvas.width, firstCanvas.height)
            ctx.drawImage(canvas, 0, 0)
            
            requestAnimationFrame(renderFrame)
        }
        
        recorder.onstop = () => {
            const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
            log('Recording complete:', {
                chunks: chunks.length,
                totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
                avgChunkSize: `${(totalSize / chunks.length / 1024).toFixed(1)}KB`
            })
            const blob = new Blob(chunks, { type: 'video/webm' })
            resolve(blob)
        }
        
        requestAnimationFrame(renderFrame)
    })
}