import { format } from 'date-fns'
import type { ModoPartida, Partida } from '@/wss/validators/go'

export const ETIQUETA_MODO: Record<ModoPartida, string> = { partida: 'Partida por territorio', atari: 'Atari Go' }

export const TEXTO_MOTIVO_FIN: Record<NonNullable<Partida['motivoFin']>, string> = {
  conteo: 'Terminó por conteo',
  abandono: 'Terminó por abandono',
  captura: 'Terminó por la primera captura',
}

export type InfoExport = {
  modo: ModoPartida
  negro: string
  blanco: string
  ganador: 'negro' | 'blanco' | null
  puntos: { negro: number; blanco: number } | null
  motivoFin: Partida['motivoFin']
}

export function infoExport(
  p: Pick<Partida, 'modo' | 'negro' | 'blanco' | 'ganadorUserId' | 'resultado' | 'motivoFin'>
): InfoExport {
  const ganador =
    p.ganadorUserId === null ? null : p.ganadorUserId === p.negro.userId ? 'negro' : 'blanco'

  return {
    modo: p.modo,
    negro: p.negro.nombre,
    blanco: p.blanco.nombre,
    ganador,
    puntos: p.resultado ? { negro: p.resultado.negro, blanco: p.resultado.blanco } : null,
    motivoFin: p.motivoFin,
  }
}

export function nombreImagenPartida(info: InfoExport, creadaEn: string): string {
  return `${info.negro} vs ${info.blanco} - ${format(new Date(creadaEn), 'dd/MM/yy - HH:mm')}.png`
}

/** Titular de la imagen de una partida terminada: quién ganó, o "Empate". */
export function tituloImagen(info: InfoExport): string {
  return info.ganador === null ? 'Empate' : `Ganó ${info[info.ganador]}`
}

/** "16/10/26" */
export const fechaCorta = (fecha: Date) => format(fecha, 'dd/MM/yy')

/** "Atari Go el 16/10/26" (`creadaEn` en ISO). */
export const modoYFechaImagen = (info: InfoExport, creadaEn: string) =>
  `${ETIQUETA_MODO[info.modo]} el ${fechaCorta(new Date(creadaEn))}`

/** "Negro vs Blanco", con los nombres de cada uno. */
export const jugadoresImagen = (info: InfoExport) => `${info.negro} vs ${info.blanco}`

/** Modo y día en que se jugó, y al final los jugadores: si no entra, se recorta por ahí. */
export function subtituloImagen(info: InfoExport, creadaEn: string): string {
  return `${modoYFechaImagen(info, creadaEn)} · ${jugadoresImagen(info)}`
}
