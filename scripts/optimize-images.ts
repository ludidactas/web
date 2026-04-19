#!/usr/bin/env bun
// Optimiza imágenes en public/ de forma idempotente:
//   PNG → WebP in-place (elimina el original)
//   GIF → GIF comprimido in-place (sin conversión; idempotencia via manifest de hashes)

import { readdir, unlink, readFile, writeFile, rename } from "fs/promises"
import { join, extname, basename, relative } from "path"
import { createHash } from "crypto"
import sharp from "sharp"

const rootDir = join(process.cwd(), process.argv[2] ?? "public")
const MANIFEST_PATH = join(rootDir, ".image-manifest.json")

type Manifest = Record<string, string> // relPath → sha256 del archivo ya procesado

async function loadManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf-8"))
  } catch {
    return {}
  }
}

async function sha256(filePath: string): Promise<string> {
  const buf = await readFile(filePath)
  return createHash("sha256").update(buf).digest("hex")
}

async function processDir(dir: string, manifest: Manifest): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true })
  let count = 0

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      count += await processDir(fullPath, manifest)
      continue
    }

    const ext = extname(entry.name).toLowerCase()

    if (ext === ".png") {
      const outPath = join(dir, basename(entry.name, ext) + ".webp")
      await sharp(fullPath).webp({ quality: 85 }).toFile(outPath)
      await unlink(fullPath)
      console.log(`✓ PNG→WebP  ${relative(rootDir, fullPath)}`)
      count++
      continue
    }

    if (ext === ".gif") {
      const relPath = relative(rootDir, fullPath)
      const currentHash = await sha256(fullPath)

      if (manifest[relPath] === currentHash) {
        console.log(`  skip      ${relPath}`)
        continue
      }

      const tmpPath = fullPath + ".tmp"
      await sharp(fullPath, { animated: true }).gif({ effort: 10 }).toFile(tmpPath)

      const [origBuf, newBuf] = await Promise.all([readFile(fullPath), readFile(tmpPath)])

      if (newBuf.length < origBuf.length) {
        const saved = ((origBuf.length - newBuf.length) / 1024).toFixed(1)
        await rename(tmpPath, fullPath)
        console.log(`✓ GIF      ${relPath} (-${saved} KB)`)
      } else {
        await unlink(tmpPath)
        console.log(`  GIF ok    ${relPath} (ya estaba óptimo)`)
      }

      manifest[relPath] = await sha256(fullPath)
      count++
    }
  }

  return count
}

const manifest = await loadManifest()
console.log(`Procesando ${rootDir}...\n`)
const total = await processDir(rootDir, manifest)
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
console.log(`\nListo. ${total} archivo(s) procesado(s).`)
