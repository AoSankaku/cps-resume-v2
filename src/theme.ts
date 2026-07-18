export const THEME_SATURATION = 92
export const THEME_LIGHTNESS = 60

export const normalizeThemeHue = (hue: number) => Math.round(((hue % 360) + 360) % 360)

export const getThemeColor = (hue: number, alpha = 1) =>
  `hsl(${normalizeThemeHue(hue)} ${THEME_SATURATION}% ${THEME_LIGHTNESS}% / ${alpha})`

const hslToRgb = (hue: number) => {
  const h = normalizeThemeHue(hue) / 360
  const s = THEME_SATURATION / 100
  const l = THEME_LIGHTNESS / 100
  const hueToRgb = (p: number, q: number, channel: number) => {
    let value = channel
    if (value < 0) value += 1
    if (value > 1) value -= 1
    if (value < 1 / 6) return p + (q - p) * 6 * value
    if (value < 1 / 2) return q
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hueToRgb(p, q, h + 1 / 3), hueToRgb(p, q, h), hueToRgb(p, q, h - 1 / 3)]
}

export const getThemeContrastColor = (hue: number) => {
  const luminance = hslToRgb(hue)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  return luminance > 0.179 ? '#08090a' : '#ffffff'
}
