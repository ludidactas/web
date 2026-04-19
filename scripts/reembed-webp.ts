#!/usr/bin/env bun
// Pre-processor para SVGO: reemplaza data:image/png y jpeg embebidos → WebP.
// Corre in-place sobre svg/src antes de que SVGO genere dist.
// Idempotente: data:image/webp ya existentes son ignorados.

import { readFile, writeFile, readdir } from "fs/promises"
import { join, extname, relative } from "path"
import sharp from "sharp"

const srcDir = join(process.cwd(), process.argv[2] ?? "svg/src")

// Solo PNG y JPEG — WebP queda excluido → idempotencia natural
const DATA_URI_RE = /data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=\s]+)/g

async function reembedSvg(filePath: string): Promise<void> {
  const original = await readFile(filePath, "utf-8")
  const matches = [...original.matchAll(DATA_URI_RE)]
  if (matches.length === 0) return

  type Replacement = { start: number; end: number; data: string }
  const replacements: Replacement[] = []
  let totalSaved = 0

  for (const match of matches) {
    const [fullMatch, , b64raw] = match
    const inputBuf = Buffer.from(b64raw.replace(/\s/g, ""), "base64")
    const outputBuf = await sharp(inputBuf).webp({ quality: 85 }).toBuffer()

    // Conservar PNG si WebP no ayuda (iconos pequeños, etc.)
    if (outputBuf.length >= inputBuf.length) continue

    totalSaved += inputBuf.length - outputBuf.length
    replacements.push({
      start: match.index!,
      end: match.index! + fullMatch.length,
      data: `data:image/webp;base64,${outputBuf.toString("base64")}`,
    })
  }

  if (replacements.length === 0) return

  // Aplicar de atrás hacia adelante para no invalidar los índices anteriores
  replacements.sort((a, b) => b.start - a.start)
  let result = original
  for (const { start, end, data } of replacements) {
    result = result.slice(0, start) + data + result.slice(end)
  }

  await writeFile(filePath, result, "utf-8")
  const rel = relative(process.cwd(), filePath)
  const savedKB = (totalSaved / 1024).toFixed(1)
  const n = replacements.length
  console.log(`✓ ${rel}  (${n} imagen${n > 1 ? "es" : ""} → WebP, -${savedKB} KB)`)
}

async function processDir(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath)
    } else if (extname(entry.name).toLowerCase() === ".svg") {
      await reembedSvg(fullPath)
    }
  }
}

console.log(`Re-embebiendo imágenes en ${srcDir}...\n`)
await processDir(srcDir)
console.log("\nListo.")
