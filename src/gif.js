import { captureState, getSVGDimensions } from './svgcap.js'
import { encode } from 'modern-gif'

const FPS = 30
const DURATION = 10

export default async (svg, onProgress) => {
  const userSpeed = Number(document.getElementById('speed')?.value) || 5
  const cyclesPerSecond = userSpeed / 10
  const totalFrames = FPS * DURATION
  const { width, height } = getSVGDimensions(svg)
  const w = Math.floor(width)
  const h = Math.floor(height)
  const delays = 1000 / FPS
  const indices = Array.from({ length: totalFrames }, (_, i) => i)
  const canvases = []
  await indices.reduce(
    (p, i) => p.then(async () => {
      const t = i / totalFrames
      const animProgress = (t * DURATION * cyclesPerSecond) % 1
      onProgress?.(i / totalFrames)
      const canvas = await captureState(svg, animProgress)
      canvases.push(canvas)
    }),
    Promise.resolve()
  )
  const frames = canvases.map(canvas => ({
    data: canvas,
    delay: delays
  }))
  const output = await encode({
    width: w,
    height: h,
    frames,
    maxColors: 255,
    premultipliedAlpha: false,
    debug: false
  })
  return new Blob([output], { type: 'image/gif' })
}
