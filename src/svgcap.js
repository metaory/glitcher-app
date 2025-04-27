export const getSVGDimensions = svg => ({
    width: svg.getAttribute('viewBox')?.split(' ')[2] || svg.width.baseVal.value,
    height: svg.getAttribute('viewBox')?.split(' ')[3] || svg.height.baseVal.value
})

export const createCanvas = ({width, height}) => {
    width = Math.floor(width / 2) * 2
    height = Math.floor(height / 2) * 2
    return Object.assign(document.createElement('canvas'), {width, height})
}

export const updateAnimationState = (svg, time) => {
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

export const svgToImage = (svg, width = 1, height = 1) => new Promise((resolve, reject) => {
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml'})
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
    }
    img.onerror = () => {
        URL.revokeObjectURL(url)
        const fallback = document.createElement('canvas')
        fallback.width = width
        fallback.height = height
        resolve(fallback)
    }
    img.src = url
})

export const captureState = async (svg, time) => {
    const svgCopy = updateAnimationState(svg, time)
    const { width, height } = getSVGDimensions(svg)
    const canvas = createCanvas({ width, height })
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const img = await svgToImage(svgCopy, canvas.width, canvas.height)
    if (!(img instanceof HTMLImageElement || img instanceof HTMLCanvasElement || (window.ImageBitmap && img instanceof ImageBitmap))) {
      return canvas
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
} 