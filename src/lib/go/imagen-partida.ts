import { body } from '@/components/fonts'
import { generarImagenResultado } from '@/lib/go-local/imagen-resultado'
import type { InfoExport } from './info-export'
import { jugadoresImagen, modoYFechaImagen, subtituloImagen, TEXTO_MOTIVO_FIN, tituloImagen } from './info-export'
import type { Tablero } from './motor'
import { tableroASvg } from './tablero-svg'

/** Lo que agrega la imagen de quien jugó la partida y la descarga desde la sala. */
export interface ImagenPersonal {
  /** La ilustración de su color ganando o perdiendo, como `<svg>` de texto de `px` de lado. */
  ilustracion: (px: number) => string
  capturasNegras: number
  capturasBlancas: number
}

/**
 * PNG de una partida terminada, sin necesitar el tablero en pantalla (descarga desde la sala y
 * subida a Drive). Sin `personal`, con el mismo formato que la imagen que se comparte desde
 * `/go/tablero`: el marcador muestra los puntos y se omite cuando la partida terminó sin conteo
 * (abandono). Con `personal`, la ilustración encabeza la imagen y a su lado van el detalle (modo,
 * jugadores y cómo terminó), los puntos (si hubo conteo) y las capturas.
 */
export function imagenPartida(
  tablero: Tablero,
  tamaño: number,
  removidas: boolean[][] | null | undefined,
  info: InfoExport,
  creadaEn: string,
  personal?: ImagenPersonal
): Promise<Blob> {
  const comun = {
    tablero: (px: number, margen: number) => tableroASvg(tablero, tamaño, removidas, px, margen),
    familia: body.style.fontFamily,
    titulo: tituloImagen(info),
  }
  const puntos =
    info.puntos && { etiqueta: 'Puntos:', bajoBlanco: info.puntos.blanco, bajoNegro: info.puntos.negro }

  if (!personal)
    return generarImagenResultado({ ...comun, subtitulo: subtituloImagen(info, creadaEn), marcador: puntos })

  return generarImagenResultado({
    ...comun,
    encabezado: {
      ilustracion: personal.ilustracion,
      detalle: [
        modoYFechaImagen(info, creadaEn),
        jugadoresImagen(info),
        ...(info.motivoFin ? [TEXTO_MOTIVO_FIN[info.motivoFin]] : []),
      ],
      marcadores: [
        ...(puntos ? [puntos] : []),
        // Como en `PanelCapturas`: bajo cada piedra, las de ese color que capturó el otro.
        { etiqueta: 'Capturas:', bajoBlanco: personal.capturasNegras, bajoNegro: personal.capturasBlancas },
      ],
    },
  })
}
