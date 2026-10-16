import { body } from '@/components/fonts'
import { generarImagenResultado } from '@/lib/go-local/imagen-resultado'
import type { InfoExport } from './info-export'
import { subtituloImagen, tituloImagen } from './info-export'
import type { Tablero } from './motor'
import { tableroASvg } from './tablero-svg'

/**
 * PNG de una partida terminada, sin necesitar el tablero en pantalla (descarga desde la sala y
 * subida a Drive). Con el mismo formato que la imagen que se comparte desde `/go/tablero`; el
 * marcador muestra los puntos y se omite cuando la partida terminó sin conteo (abandono).
 */
export function imagenPartida(
  tablero: Tablero,
  tamaño: number,
  removidas: boolean[][] | null | undefined,
  info: InfoExport,
  creadaEn: string
): Promise<Blob> {
  return generarImagenResultado({
    tablero: (px, margen) => tableroASvg(tablero, tamaño, removidas, px, margen),
    familia: body.style.fontFamily,
    titulo: tituloImagen(info),
    subtitulo: subtituloImagen(info, creadaEn),
    marcador: info.puntos && { etiqueta: 'Puntos:', bajoBlanco: info.puntos.blanco, bajoNegro: info.puntos.negro },
  })
}
