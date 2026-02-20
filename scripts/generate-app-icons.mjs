/**
 * Generates app icons (PNG + ICO) from public/price-lens-new.svg.
 * Run: node scripts/generate-app-icons.mjs
 * Requires: pnpm add -D sharp to-ico
 */
import sharp from "sharp"
import toIco from "to-ico"
import { readFile, writeFile, mkdir } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const srcSvg = join(root, "public", "price-lens-new.svg")
const iconsDir = join(root, "public", "icons")

const SIZES = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
]

async function main() {
  const svgBuffer = await readFile(srcSvg)
  await mkdir(iconsDir, { recursive: true })

  const pngs = {}
  for (const { size, name } of SIZES) {
    const outPath = join(iconsDir, name)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`Wrote ${name} (${size}x${size})`)
    if (size === 16 || size === 32) {
      pngs[size] = await readFile(outPath)
    }
  }

  const faviconPath = join(root, "public", "favicon.ico")
  const icoBuffer = await toIco([pngs[16], pngs[32]])
  await writeFile(faviconPath, icoBuffer)
  console.log("Wrote favicon.ico")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
