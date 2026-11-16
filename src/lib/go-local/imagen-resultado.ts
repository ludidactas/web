import {
  ajustarTexto,
  canvasAPng,
  cargarFirma,
  dibujarFirma,
  EXPORT_SCALE,
  FIRMA_ALTO,
  svgAImagen,
  trazarRectRedondeado,
} from '@/lib/imagen-compartible'
import { BLANCO, NEGRO, type Color } from '@/lib/go/motor'
import { CELDA_PX, MARGEN_PX, TONOS_PIEDRA } from '@/lib/go/tablero-go-base'

/**
 * Imagen PNG del resultado de una partida, para compartir: título y subtítulo alineados al borde
 * izquierdo del tablero, el tablero, el marcador (capturas o puntos) y la firma de Ludidactas al pie.
 * Con `encabezado`, arriba del tablero van una ilustración y a su derecha el título, el detalle y los
 * marcadores. Mismo estilo que la imagen del QR de sala.
 */

/** Rótulo del marcador ("Puntos:" o "Capturas:") y su valor bajo cada color de piedra, en el orden en que se muestran. */
export interface Marcador {
  etiqueta: string
  bajoBlanco: number
  bajoNegro: number
}

/** Encabezado con ilustración: reemplaza al subtítulo y al marcador bajo el tablero. */
export interface Encabezado {
  /** La ilustración como `<svg>` de texto (con `xmlns`) de `px` de lado. */
  ilustracion: (px: number) => string
  /** Una línea cada uno, bajo el título. */
  detalle: string[]
  /** Uno por línea, bajo el detalle. */
  marcadores: Marcador[]
}

interface DatosComunes {
  /**
   * El `<svg>` del tablero con `xmlns`, de `px` de lado más `margen` transparente por cada borde, donde
   * asoma la sombra del tablero (ver `svgDelTableroVivo` y `tableroASvg`).
   */
  tablero: (px: number, margen: number) => string
  /** Tipografía del texto de la imagen. */
  familia: string
  /** "Ganó Negro" o "Empate". */
  titulo: string
}

export type DatosImagenResultado = DatosComunes &
  (
    | {
        /** Bajo el título (ej. el modo de la partida). */
        subtitulo: string
        /** Sin marcador la imagen no reserva su fila. */
        marcador: Marcador | null
      }
    | { encabezado: Encabezado }
  )

const PADDING = 24
const TABLERO = 320
// La sombra "flotante" del tablero (dy 3, desvío 4) asoma hasta este margen; entra en el padding.
const SOMBRA = 16
const ANCHO = TABLERO + PADDING * 2
const RADIO = 6
const ALTO_TITULO = 24
const ALTO_MODO = 12
const GAP_TITULO = 2
const GAP_ENCABEZADO = 16
const GAP_MARCADOR = 22
const ALTO_MARCADOR = 20
const GAP_FIRMA = 22
// La firma de Ludidactas va más chica que en el QR para que el tablero sea el protagonista.
const ESCALA_FIRMA = 0.7
const ALTO_FIRMA = FIRMA_ALTO * ESCALA_FIRMA
const alto = (altoEncabezado: number, conMarcador: boolean) =>
  PADDING +
  altoEncabezado +
  GAP_ENCABEZADO +
  TABLERO +
  (conMarcador ? GAP_MARCADOR + ALTO_MARCADOR : 0) +
  GAP_FIRMA +
  ALTO_FIRMA +
  PADDING

// Encabezado con ilustración: la ilustración a la izquierda y el texto a su derecha, centrados entre sí.
const ILUSTRACION = 112
const GAP_ILUSTRACION = 12
const TEXTO_X = PADDING + ILUSTRACION + GAP_ILUSTRACION
const TEXTO_ANCHO = ANCHO - PADDING - TEXTO_X
const ALTO_LINEA_TITULO = 26
const MAX_LINEAS_TITULO = 2
const ALTO_DETALLE = 14
const ALTO_MARCADOR_ENCABEZADO = 18
const GAP_TEXTO = 6

const COLOR_TITULO = '#000000'
const COLOR_MODO = '#94a3b8' // slate-400
const COLOR_MARCADOR = '#475569' // slate-600
const RADIO_PIEDRA_MARCADOR = 8

/**
 * Copia el `<svg>` del tablero en pantalla como un SVG independiente de `px` de lado, con `margen` de
 * sombra alrededor (sin el resplandor de turno de la partida en vivo). Los estilos que le llegan por clases de CSS (ej. el anillo
 * de la última jugada) no viajan dentro de un SVG suelto, así que se escriben como atributos a
 * partir de los calculados.
 */
export function svgDelTableroVivo(vivo: SVGSVGElement, tamaño: number, px: number, margen: number): string {
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
  const sombra = (margen * lado) / px
  clon.setAttribute('viewBox', `${-sombra} ${-sombra} ${lado + 2 * sombra} ${lado + 2 * sombra}`)
  clon.setAttribute('width', String(px + 2 * margen))
  clon.setAttribute('height', String(px + 2 * margen))
  return new XMLSerializer().serializeToString(clon)
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

/**
 * Marcador "Rótulo: ⚪ n ⚫ n" con su centro vertical en `cy`: desde `x`, o centrado horizontalmente si
 * no se pasa. `tamaño` es el de la letra; las piedras escalan con ella.
 */
function dibujarMarcador(
  ctx: CanvasRenderingContext2D,
  familia: string,
  m: Marcador,
  cy: number,
  { x: desde, tamaño = 14 }: { x?: number; tamaño?: number } = {}
) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${tamaño}px ${familia}`
  ctx.fillStyle = COLOR_MARCADOR

  const escala = tamaño / 14
  const radio = RADIO_PIEDRA_MARCADOR * escala
  const GAP_ETIQUETA = 10 * escala
  const GAP_PIEDRA = 4 * escala
  const GAP_PARES = 12 * escala
  const par = (valor: number) => radio * 2 + GAP_PIEDRA + ctx.measureText(String(valor)).width
  const ancho =
    ctx.measureText(m.etiqueta).width + GAP_ETIQUETA + par(m.bajoBlanco) + GAP_PARES + par(m.bajoNegro)

  let x = desde ?? (ANCHO - ancho) / 2
  ctx.fillText(m.etiqueta, x, cy)
  x += ctx.measureText(m.etiqueta).width + GAP_ETIQUETA

  for (const [color, valor] of [
    [BLANCO, m.bajoBlanco],
    [NEGRO, m.bajoNegro],
  ] as const) {
    dibujarPiedra(ctx, x + radio, cy, radio, color)
    x += radio * 2 + GAP_PIEDRA
    ctx.fillStyle = COLOR_MARCADOR
    ctx.fillText(String(valor), x, cy)
    x += ctx.measureText(String(valor)).width + GAP_PARES
  }
}

/** Parte `texto` en palabras hasta `max` líneas de `ancho`; lo que no entra se recorta con "…". */
function partirEnLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number, max: number): string[] {
  const lineas: string[] = []
  for (const palabra of texto.split(' ')) {
    const actual = lineas.at(-1)
    if (actual !== undefined && ctx.measureText(`${actual} ${palabra}`).width <= ancho)
      lineas[lineas.length - 1] = `${actual} ${palabra}`
    else lineas.push(palabra)
  }
  const visibles = [...lineas.slice(0, max - 1), lineas.slice(max - 1).join(' ')].filter(Boolean)
  return visibles.map((linea) => ajustarTexto(ctx, linea, ancho))
}

const fuenteTituloEncabezado = (familia: string) => `bold 22px ${familia}`

/** Alto del bloque de texto a la derecha de la ilustración. */
const altoTextoEncabezado = (lineasTitulo: number, e: Encabezado) =>
  lineasTitulo * ALTO_LINEA_TITULO +
  GAP_TEXTO +
  e.detalle.length * ALTO_DETALLE +
  GAP_TEXTO +
  e.marcadores.length * ALTO_MARCADOR_ENCABEZADO

/** Ilustración a la izquierda; título, detalle y marcadores a su derecha. Ocupa `alto` desde `y`. */
function dibujarEncabezado(
  ctx: CanvasRenderingContext2D,
  familia: string,
  lineasTitulo: string[],
  e: Encabezado,
  ilustracion: HTMLImageElement,
  y: number,
  alto: number
) {
  ctx.drawImage(ilustracion, PADDING, y + (alto - ILUSTRACION) / 2, ILUSTRACION, ILUSTRACION)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  let cursor = y + (alto - altoTextoEncabezado(lineasTitulo.length, e)) / 2

  ctx.font = fuenteTituloEncabezado(familia)
  ctx.fillStyle = COLOR_TITULO
  for (const linea of lineasTitulo) {
    ctx.fillText(linea, TEXTO_X, cursor + ALTO_LINEA_TITULO / 2)
    cursor += ALTO_LINEA_TITULO
  }

  cursor += GAP_TEXTO
  ctx.font = `11px ${familia}`
  ctx.fillStyle = COLOR_MARCADOR
  for (const linea of e.detalle) {
    ctx.fillText(ajustarTexto(ctx, linea, TEXTO_ANCHO), TEXTO_X, cursor + ALTO_DETALLE / 2)
    cursor += ALTO_DETALLE
  }

  cursor += GAP_TEXTO
  for (const marcador of e.marcadores) {
    dibujarMarcador(ctx, familia, marcador, cursor + ALTO_MARCADOR_ENCABEZADO / 2, { x: TEXTO_X, tamaño: 12 })
    cursor += ALTO_MARCADOR_ENCABEZADO
  }
}

/** Compone la imagen del resultado y la devuelve como PNG. */
export async function generarImagenResultado(d: DatosImagenResultado): Promise<Blob> {
  const { familia } = d
  const encabezado = 'encabezado' in d ? d.encabezado : null
  const marcador = 'marcador' in d ? d.marcador : null
  const [firma, tablero, ilustracion] = await Promise.all([
    cargarFirma(),
    svgAImagen(d.tablero(TABLERO * EXPORT_SCALE, SOMBRA * EXPORT_SCALE)),
    encabezado && svgAImagen(encabezado.ilustracion(ILUSTRACION * EXPORT_SCALE)),
  ])
  await document.fonts.load(`bold 20px ${familia}`).catch(() => {})

  const lienzo = document.createElement('canvas')
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la imagen')

  // El título del encabezado se parte en líneas antes de dimensionar el lienzo: su alto depende de eso.
  ctx.font = fuenteTituloEncabezado(familia)
  const lineasTitulo = encabezado ? partirEnLineas(ctx, d.titulo, TEXTO_ANCHO, MAX_LINEAS_TITULO) : []
  const altoEncabezado = encabezado
    ? Math.max(ILUSTRACION, altoTextoEncabezado(lineasTitulo.length, encabezado))
    : ALTO_TITULO + GAP_TITULO + ALTO_MODO
  const altoTotal = alto(altoEncabezado, marcador !== null)

  // Cambiar el tamaño del lienzo resetea el estado del contexto (fuente incluida).
  lienzo.width = ANCHO * EXPORT_SCALE
  lienzo.height = altoTotal * EXPORT_SCALE
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)

  ctx.save()
  trazarRectRedondeado(ctx, 0, 0, ANCHO, altoTotal, RADIO)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ANCHO, altoTotal)

  if (encabezado && ilustracion) {
    dibujarEncabezado(ctx, familia, lineasTitulo, encabezado, ilustracion, PADDING, altoEncabezado)
  } else if ('subtitulo' in d) {
    // Título y subtítulo: alineados al borde izquierdo del tablero.
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `bold 20px ${familia}`
    ctx.fillStyle = COLOR_TITULO
    ctx.fillText(ajustarTexto(ctx, d.titulo, TABLERO), PADDING, PADDING + ALTO_TITULO / 2)
    ctx.font = `10px ${familia}`
    ctx.fillStyle = COLOR_MODO
    ctx.fillText(ajustarTexto(ctx, d.subtitulo, TABLERO), PADDING, PADDING + ALTO_TITULO + GAP_TITULO + ALTO_MODO / 2)
  }

  const tableroY = PADDING + altoEncabezado + GAP_ENCABEZADO
  ctx.drawImage(tablero, PADDING - SOMBRA, tableroY - SOMBRA, TABLERO + 2 * SOMBRA, TABLERO + 2 * SOMBRA)

  let firmaY = tableroY + TABLERO
  if (marcador) {
    const marcadorY = firmaY + GAP_MARCADOR
    dibujarMarcador(ctx, familia, marcador, marcadorY + ALTO_MARCADOR / 2)
    firmaY = marcadorY + ALTO_MARCADOR
  }

  dibujarFirma(ctx, firma, ANCHO, firmaY + GAP_FIRMA, ESCALA_FIRMA)
  ctx.restore()

  return canvasAPng(lienzo)
}
