import { cargarFirma, dibujarFirma, EXPORT_SCALE, FIRMA_ALTO, trazarRectRedondeado } from '@/lib/imagen-compartible'
import { BLANCO, NEGRO, type Color } from '@/lib/go/motor'
import { CELDA_PX, MARGEN_PX, TONOS_PIEDRA } from '@/lib/go/tablero-go-base'

/**
 * Imagen PNG del resultado de una partida local, para compartir: título y modo alineados al borde
 * izquierdo del tablero, el tablero tal como se ve en pantalla, el marcador (capturas o puntos) y la
 * firma de Ludidactas al pie. Mismo estilo que la imagen del QR de sala.
 */

export interface DatosImagenResultado {
  /** El `<svg>` del tablero en pantalla: se copia tal cual, con sus piedras, marcas y la última jugada. */
  tablero: SVGSVGElement
  tamañoTablero: number
  /** "Ganó Negro" o "Empate". */
  titulo: string
  /** Modo de la partida, bajo el título (ej. "Atari Go"). */
  modo: string
  /** Rótulo del marcador ("Puntos:" o "Capturas:") y su valor bajo cada color de piedra, en el orden en que se muestran. */
  etiquetaMarcador: string
  bajoBlanco: number
  bajoNegro: number
}

const PADDING = 24
const TABLERO = 320
const ANCHO = TABLERO + PADDING * 2
const RADIO = 6
const ALTO_TITULO = 24
const ALTO_MODO = 12
const GAP_TITULO = 2
const GAP_ENCABEZADO = 16
const GAP_MARCADOR = 14
const ALTO_MARCADOR = 20
const GAP_FIRMA = 16
// La firma de Ludidactas va más chica que en el QR para que el tablero sea el protagonista.
const ESCALA_FIRMA = 0.7
const ALTO_FIRMA = FIRMA_ALTO * ESCALA_FIRMA
const ALTO =
  PADDING +
  ALTO_TITULO +
  GAP_TITULO +
  ALTO_MODO +
  GAP_ENCABEZADO +
  TABLERO +
  GAP_MARCADOR +
  ALTO_MARCADOR +
  GAP_FIRMA +
  ALTO_FIRMA +
  PADDING

const COLOR_TITULO = '#000000'
const COLOR_MODO = '#94a3b8' // slate-400
const COLOR_MARCADOR = '#475569' // slate-600
const RADIO_PIEDRA_MARCADOR = 8

/**
 * Copia el `<svg>` del tablero como una imagen independiente, recortada al tablero (sin el margen de
 * resplandor). Los estilos que le llegan por clases de CSS (ej. el anillo de la última jugada) no
 * viajan dentro de un SVG suelto, así que se escriben como atributos a partir de los calculados.
 */
async function tableroComoImagen(vivo: SVGSVGElement, tamaño: number, px: number): Promise<HTMLImageElement> {
  const clon = vivo.cloneNode(true) as SVGSVGElement
  const lado = CELDA_PX * (tamaño - 1) + MARGEN_PX * 2

  const conClase = [...vivo.querySelectorAll<SVGElement>('[class]')]
  clon.querySelectorAll('[class]').forEach((copia, i) => {
    const calculado = getComputedStyle(conClase[i])
    for (const propiedad of ['fill', 'stroke', 'stroke-width', 'opacity']) {
      copia.setAttribute(propiedad, calculado.getPropertyValue(propiedad))
    }
  })

  clon.removeAttribute('class')
  clon.removeAttribute('style')
  clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clon.setAttribute('viewBox', `0 0 ${lado} ${lado}`)
  clon.setAttribute('width', String(px))
  clon.setAttribute('height', String(px))

  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clon)], { type: 'image/svg+xml;charset=utf-8' })
  )
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo dibujar el tablero'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Piedra del marcador, con el mismo gradiente que `PiedraIcono`. */
function dibujarPiedra(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: Color) {
  const [claro, oscuro] = TONOS_PIEDRA[color]
  const gradiente = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 0, cx - r * 0.3, cy - r * 0.4, r * 1.5)
  gradiente.addColorStop(0, claro)
  gradiente.addColorStop(1, oscuro)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 1.5
  ctx.shadowOffsetY = 0.6
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = gradiente
  ctx.fill()
  if (color === BLANCO) {
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 0.7
    ctx.strokeStyle = '#1a1a1a'
    ctx.stroke()
  }
  ctx.restore()
}

/** Marcador "Rótulo: ⚪ n ⚫ n", centrado horizontalmente con su centro vertical en `cy`. */
function dibujarMarcador(ctx: CanvasRenderingContext2D, familia: string, d: DatosImagenResultado, cy: number) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `600 14px ${familia}`
  ctx.fillStyle = COLOR_MARCADOR

  const GAP_ETIQUETA = 10
  const GAP_PIEDRA = 4
  const GAP_PARES = 12
  const par = (valor: number) => RADIO_PIEDRA_MARCADOR * 2 + GAP_PIEDRA + ctx.measureText(String(valor)).width
  const ancho =
    ctx.measureText(d.etiquetaMarcador).width + GAP_ETIQUETA + par(d.bajoBlanco) + GAP_PARES + par(d.bajoNegro)

  let x = (ANCHO - ancho) / 2
  ctx.fillText(d.etiquetaMarcador, x, cy)
  x += ctx.measureText(d.etiquetaMarcador).width + GAP_ETIQUETA

  for (const [color, valor] of [
    [BLANCO, d.bajoBlanco],
    [NEGRO, d.bajoNegro],
  ] as const) {
    dibujarPiedra(ctx, x + RADIO_PIEDRA_MARCADOR, cy, RADIO_PIEDRA_MARCADOR, color)
    x += RADIO_PIEDRA_MARCADOR * 2 + GAP_PIEDRA
    ctx.fillStyle = COLOR_MARCADOR
    ctx.fillText(String(valor), x, cy)
    x += ctx.measureText(String(valor)).width + GAP_PARES
  }
}

/** Compone la imagen del resultado y la devuelve como PNG. */
export async function generarImagenResultado(d: DatosImagenResultado): Promise<Blob> {
  // La tipografía es la misma de la pantalla (la hereda el `<svg>` del tablero).
  const familia = getComputedStyle(d.tablero).fontFamily
  const [firma, tablero] = await Promise.all([
    cargarFirma(),
    tableroComoImagen(d.tablero, d.tamañoTablero, TABLERO * EXPORT_SCALE),
  ])
  await document.fonts.load(`bold 20px ${familia}`).catch(() => {})

  const lienzo = document.createElement('canvas')
  lienzo.width = ANCHO * EXPORT_SCALE
  lienzo.height = ALTO * EXPORT_SCALE
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la imagen')
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)

  ctx.save()
  trazarRectRedondeado(ctx, 0, 0, ANCHO, ALTO, RADIO)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ANCHO, ALTO)

  // Título y modo: alineados al borde izquierdo del tablero.
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 20px ${familia}`
  ctx.fillStyle = COLOR_TITULO
  ctx.fillText(d.titulo, PADDING, PADDING + ALTO_TITULO / 2)
  ctx.font = `10px ${familia}`
  ctx.fillStyle = COLOR_MODO
  ctx.fillText(d.modo, PADDING, PADDING + ALTO_TITULO + GAP_TITULO + ALTO_MODO / 2)

  const tableroY = PADDING + ALTO_TITULO + GAP_TITULO + ALTO_MODO + GAP_ENCABEZADO
  ctx.drawImage(tablero, PADDING, tableroY, TABLERO, TABLERO)

  const marcadorY = tableroY + TABLERO + GAP_MARCADOR
  dibujarMarcador(ctx, familia, d, marcadorY + ALTO_MARCADOR / 2)

  dibujarFirma(ctx, firma, ANCHO, marcadorY + ALTO_MARCADOR + GAP_FIRMA, ESCALA_FIRMA)
  ctx.restore()

  return new Promise<Blob>((resolve, reject) =>
    lienzo.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png')
  )
}
