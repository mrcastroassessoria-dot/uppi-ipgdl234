import sharp from "sharp"
import { join } from "path"

const root = "/vercel/share/v0-project"

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputFile = join(root, "public/icons/icon-512x512.png")
const outputDir = join(root, "public/icons")
const publicDir = join(root, "public")

// Gera todos os tamanhos do manifest
for (const size of sizes) {
  const outputFile = join(outputDir, `icon-${size}x${size}.png`)
  await sharp(inputFile).resize(size, size).png().toFile(outputFile)
  console.log(`Gerado: icon-${size}x${size}.png`)
}

// Apple touch icon (180x180)
await sharp(inputFile).resize(180, 180).png().toFile(join(publicDir, "apple-icon.png"))
console.log("Gerado: apple-icon.png")

// Favicons 32x32
await sharp(inputFile).resize(32, 32).png().toFile(join(publicDir, "icon-dark-32x32.png"))
console.log("Gerado: icon-dark-32x32.png")

await sharp(inputFile).resize(32, 32).png().toFile(join(publicDir, "icon-light-32x32.png"))
console.log("Gerado: icon-light-32x32.png")

// favicon.ico (32x32)
await sharp(inputFile).resize(32, 32).png().toFile(join(publicDir, "favicon.ico"))
console.log("Gerado: favicon.ico")

console.log("\nTodos os icones gerados com sucesso!")
