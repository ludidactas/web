import { titulo as fuenteTitulo } from '@/components/fonts'

/**
 * Piezas comunes de las imágenes PNG que la app compone sobre un canvas para compartir (QR de sala,
 * resultado del tablero): fondo blanco redondeado, y la firma de Ludidactas (logo + lema + tagline,
 * igual que la header del sitio) al pie. Todo se dibuja en unidades "lógicas" sobre un canvas escalado
 * por `EXPORT_SCALE`.
 */

// Multiplica la resolución final sin tocar el layout (todo el dibujado sigue en unidades "lógicas"):
// evita que la imagen pegada en WhatsApp/Slack se vea borrosa al hacer zoom o mostrarla más grande.
export const EXPORT_SCALE = 3

const FOOTER_ICON_SIZE = 28
const FOOTER_ICON_GAP = 8
const FOOTER_LEMA_WIDTH = 130
const FOOTER_LEMA_HEIGHT = Math.round((FOOTER_LEMA_WIDTH * 679) / 6558) // aspect ratio real de lema_sketchy_offlines.webp
const FOOTER_TAGLINE_GAP = 3
const FOOTER_TAGLINE_HEIGHT = 14

/** Alto que ocupa la firma. */
export const FIRMA_ALTO = Math.max(FOOTER_ICON_SIZE, FOOTER_LEMA_HEIGHT + FOOTER_TAGLINE_GAP + FOOTER_TAGLINE_HEIGHT)

/** Traza un rectángulo con las esquinas redondeadas, sin dibujarlo (llamar a fill/clip después). */
export function trazarRectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/** Carga una imagen; resuelve `undefined` (en vez de rechazar) si falla, para poder exportar igual sin ella. */
export const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement | undefined>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(undefined)
    img.src = src
  })

export interface Firma {
  logo?: HTMLImageElement
  lema?: HTMLImageElement
}

/** Carga las imágenes y la tipografía de la firma; llamar antes de `dibujarFirma`. */
export async function cargarFirma(): Promise<Firma> {
  const [logo, lema] = await Promise.all([
    cargarImagen('/img/Logo.webp'),
    cargarImagen('/img/lema_sketchy_offlines.webp'),
  ])
  // La tagline usa la misma tipografía (Chelsea Market) que "Educación emergente" en la home; si no
  // llega a cargar a tiempo, el canvas cae al fallback de la familia y se ve igual de legible.
  await document.fonts.load(`${FOOTER_TAGLINE_HEIGHT}px ${fuenteTitulo.style.fontFamily}`).catch(() => {})
  return { logo, lema }
}

/**
 * Dibuja la firma centrada horizontalmente en un lienzo de `anchoLienzo`, con su borde superior en `y`.
 * `escala` la achica o agranda (el alto que ocupa es `FIRMA_ALTO * escala`).
 */
export function dibujarFirma(
  ctx: CanvasRenderingContext2D,
  { logo, lema }: Firma,
  anchoLienzo: number,
  y: number,
  escala = 1
) {
  const ancho = FOOTER_ICON_SIZE + FOOTER_ICON_GAP + FOOTER_LEMA_WIDTH

  ctx.save()
  ctx.translate(anchoLienzo / 2, y)
  ctx.scale(escala, escala)
  let x = -ancho / 2

  if (logo) ctx.drawImage(logo, x, (FIRMA_ALTO - FOOTER_ICON_SIZE) / 2, FOOTER_ICON_SIZE, FOOTER_ICON_SIZE)
  x += FOOTER_ICON_SIZE + FOOTER_ICON_GAP

  if (lema) ctx.drawImage(lema, x, 0, FOOTER_LEMA_WIDTH, FOOTER_LEMA_HEIGHT)

  ctx.font = `${FOOTER_TAGLINE_HEIGHT - 2}px ${fuenteTitulo.style.fontFamily}`
  ctx.fillStyle = '#1f2937'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Educación emergente', x, FOOTER_LEMA_HEIGHT + FOOTER_TAGLINE_GAP + FOOTER_TAGLINE_HEIGHT / 2)
  ctx.restore()
}
