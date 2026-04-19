import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const publicDir = resolve(root, 'public')
const fontsDir = resolve(__dirname, '.fonts')

const FONTS = [
  {
    name: 'Inter',
    weight: 500,
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf',
    file: 'Inter-Medium.ttf',
  },
  {
    name: 'Inter',
    weight: 800,
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf',
    file: 'Inter-ExtraBold.ttf',
  },
]

async function ensureFont(def) {
  if (!existsSync(fontsDir)) mkdirSync(fontsDir, { recursive: true })
  const path = resolve(fontsDir, def.file)
  if (!existsSync(path)) {
    console.log(`Downloading ${def.file}…`)
    const res = await fetch(def.url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`Font download failed: ${def.url} (${res.status})`)
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(path, buf)
  }
  return { name: def.name, weight: def.weight, style: 'normal', data: readFileSync(path) }
}

const DARK = '#0b1220'
const SLATE = '#64748b'

function dotPatternBg(width, height) {
  const step = 24
  const radius = 2
  const dots = []
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const dx = x - width / 2
      const dy = y - height / 2
      const dist = Math.sqrt(dx * dx + dy * dy)
      const max = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
      const t = dist / max
      const opacity = Math.max(0, Math.min(0.12, t * 0.18))
      if (opacity > 0.01) dots.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="#000" fill-opacity="${opacity.toFixed(3)}"/>`
      )
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${dots.join('')}</svg>`
  )}`
}

function ogNode(width, height) {
  return {
    type: 'div',
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        backgroundImage: `url("${dotPatternBg(width, height)}")`,
        backgroundSize: `${width}px ${height}px`,
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: 140,
              fontWeight: 800,
              color: DARK,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            },
            children: 'DNS Checker',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              marginTop: 28,
              fontSize: 44,
              fontWeight: 500,
              color: SLATE,
              letterSpacing: '0.02em',
            },
            children: 'A · MX · TXT lookup',
          },
        },
      ],
    },
  }
}

function iconSvgMarkup(size) {
  const r = size * 0.22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${DARK}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, system-ui, sans-serif" font-weight="800"
        font-size="${size * 0.58}" fill="#ffffff" letter-spacing="-0.04em">@</text>
</svg>`
}

async function main() {
  const fonts = await Promise.all(FONTS.map(ensureFont))

  const W = 1200, H = 630
  const svg = await satori(ogNode(W, H), { width: W, height: H, fonts })
  const ogPng = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
  writeFileSync(resolve(publicDir, 'og-image.png'), ogPng)
  console.log('✓ public/og-image.png')

  const faviconSvg = iconSvgMarkup(64)
  writeFileSync(resolve(publicDir, 'favicon.svg'), faviconSvg)
  console.log('✓ public/favicon.svg')

  const apple = new Resvg(iconSvgMarkup(180), { fitTo: { mode: 'width', value: 180 } }).render().asPng()
  writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), apple)
  console.log('✓ public/apple-touch-icon.png')

  const ico32 = new Resvg(iconSvgMarkup(32), { fitTo: { mode: 'width', value: 32 } }).render().asPng()
  writeFileSync(resolve(publicDir, 'favicon.ico'), ico32)
  console.log('✓ public/favicon.ico (PNG-in-ICO, 32×32)')
}

main().catch((e) => { console.error(e); process.exit(1) })
