import { renderToStaticMarkup } from 'react-dom/server'
import { BLANCO, NEGRO, type Color, type Tablero } from './motor'
import { BLANCO_MUERTA, CELDA_PX, MARGEN_PX, PiedraIcono, TableroGoBase, type EstadoPiedra } from './tablero-go-base'
import type { InfoExport } from './info-export'
import { body } from '@/components/fonts'

const ESCALA = 2
const PAD = 10
const TAB = 280
const FILA = 40
const GAP = 14
// Margen extra en el viewBox del tablero para que la sombra "flotante" (`feDropShadow` del tablero,
// dy=3, stdDeviation=4) no quede recortada por el borde del SVG.
const SOMBRA_TABLERO = 16
const ANCHO = TAB + 2 * PAD
const ALTO = PAD + TAB + GAP + 2 * FILA + PAD

export function ladoDe(tamaño: number): number {
  return MARGEN_PX * 2 + (tamaño - 1) * CELDA_PX
}

function estadoPiedra(removidas: boolean[][] | null | undefined) {
  return (fila: number, columna: number, valor: Color): EstadoPiedra => {
    const muerta = removidas?.[fila]?.[columna] ?? false
    return {
      opacidad: muerta ? 0.35 : 1,
      fill: muerta && valor === BLANCO ? BLANCO_MUERTA : undefined,
    }
  }
}

export function tableroASvg(tablero: Tablero, tamaño: number, removidas?: boolean[][] | null): string {
  const lado = ladoDe(tamaño)
  const total = lado + 2 * SOMBRA_TABLERO
  const svg = renderToStaticMarkup(
    <TableroGoBase
      tablero={tablero}
      tamaño={tamaño}
      glowMargen={SOMBRA_TABLERO}
      estadoPiedra={estadoPiedra(removidas)}
    />
  )

  const conDimensiones = svg.replace(
    'width="100%" height="100%"',
    `width="${total}" height="${total}"`
  )

  const conXmlns = conDimensiones.includes('xmlns=')
    ? conDimensiones
    : conDimensiones.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')

  return conXmlns
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    img.src = src
  })
}

async function piedraComoImagen(color: Color): Promise<HTMLImageElement> {
  const marcado = renderToStaticMarkup(<PiedraIcono color={color} />)
  const conXmlns = marcado.includes('xmlns=')
    ? marcado
    : marcado.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  const conDimensiones = conXmlns.replace('<svg ', '<svg width="20" height="20" ')
  const url = URL.createObjectURL(new Blob([conDimensiones], { type: 'image/svg+xml' }))
  try {
    return await cargarImagen(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function tableroAPng(
  tablero: Tablero,
  tamaño: number,
  removidas: boolean[][] | null | undefined,
  info: InfoExport
): Promise<Blob> {
  const svg = tableroASvg(tablero, tamaño, removidas)

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const gatoAzar = Math.random() < 0.5 ? '/img/gato-trofeo-1.png' : '/img/gato-trofeo-2.png'

  try {
    const [tableroImg, gato, piedraNegra, piedraBlanca] = await Promise.all([
      cargarImagen(url),
      cargarImagen(gatoAzar),
      piedraComoImagen(NEGRO),
      piedraComoImagen(BLANCO),
    ])

    const canvas = document.createElement('canvas')
    canvas.width = ANCHO * ESCALA
    canvas.height = ALTO * ESCALA
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear el contexto del canvas')

    ctx.scale(ESCALA, ESCALA)

    ctx.fillStyle = '#ffffff'
    ctx.roundRect(0, 0, ANCHO, ALTO, 12)
    ctx.fill()

    // El SVG del tablero incluye `SOMBRA_TABLERO` de margen transparente alrededor para que la
    // sombra no se recorte. Escalamos/dibujamos de modo que el contenido del tablero (lado) quede
    // exactamente en TAB×TAB con su esquina en (PAD, PAD), dejando la sombra asomar por fuera.
    const ladoTablero = ladoDe(tamaño)
    const escalaTablero = TAB / ladoTablero
    const ladoSvgTotal = ladoTablero + 2 * SOMBRA_TABLERO
    const corrimiento = SOMBRA_TABLERO * escalaTablero
    ctx.drawImage(
      tableroImg,
      PAD - corrimiento,
      PAD - corrimiento,
      ladoSvgTotal * escalaTablero,
      ladoSvgTotal * escalaTablero
    )

    await document.fonts.load(`18px ${body.style.fontFamily}`).catch(() => {})
    ctx.font = `18px ${body.style.fontFamily}`
    ctx.fillStyle = '#1f2937'
    ctx.textBaseline = 'middle'

    const filas: Array<{ nombre: string; color: Color; ganador: boolean; puntos: string | null }> = [
      { nombre: info.negro, color: NEGRO, ganador: info.ganador === 'negro', puntos: info.puntos ? String(info.puntos.negro) : null },
      { nombre: info.blanco, color: BLANCO, ganador: info.ganador === 'blanco', puntos: info.puntos ? String(info.puntos.blanco) : null },
    ]

    filas.forEach((fila, i) => {
      const cy = PAD + TAB + GAP + FILA * i + FILA / 2

      if (fila.ganador) {
        // Fit "contain" sin deformar: los gatos son verticales (más altos que anchos),
        // el slot es cuadrado (26×26). Escalamos por el alto para que entre entero y
        // centramos horizontalmente el ancho resultante.
        const slotLado = 26
        const escala = slotLado / gato.naturalHeight
        const anchoGato = gato.naturalWidth * escala
        const altoGato = gato.naturalHeight * escala
        ctx.drawImage(gato, PAD + (slotLado - anchoGato) / 2, cy - altoGato / 2, anchoGato, altoGato)
      }

      ctx.drawImage(fila.color === NEGRO ? piedraNegra : piedraBlanca, PAD + 32, cy - 10, 20, 20)

      const xNombre = PAD + 62
      const anchoDisponible = ANCHO - PAD - xNombre - 50
      let nombreFinal: string
      if (ctx.measureText(fila.nombre).width <= anchoDisponible) {
        nombreFinal = fila.nombre
      } else {
        let nombreBase = fila.nombre
        while (nombreBase.length > 0 && ctx.measureText(nombreBase + '…').width > anchoDisponible) {
          nombreBase = nombreBase.slice(0, -1)
        }
        nombreFinal = nombreBase + '…'
      }
      ctx.textAlign = 'left'
      ctx.fillText(nombreFinal, xNombre, cy)

      if (fila.puntos !== null) {
        ctx.textAlign = 'right'
        ctx.fillText(fila.puntos, ANCHO - PAD, cy)
        ctx.textAlign = 'left'
      }
    })

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((resultado) => {
        if (!resultado) reject(new Error('No se pudo generar el PNG'))
        else resolve(resultado)
      }, 'image/png')
    })

    return png
  } finally {
    URL.revokeObjectURL(url)
  }
}


