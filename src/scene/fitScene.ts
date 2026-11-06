export function fitScene(viewportWidth: number, viewportHeight: number, logicalSize: { width: number; height: number }) {
  if (![viewportWidth, viewportHeight, logicalSize.width, logicalSize.height].every(value => Number.isFinite(value) && value > 0)) return { width: 0, height: 0, scale: 0 }
  const scale = Math.min(viewportWidth / logicalSize.width, viewportHeight / logicalSize.height)
  return { width: logicalSize.width * scale, height: logicalSize.height * scale, scale }
}
