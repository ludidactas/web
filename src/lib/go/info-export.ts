import { format } from 'date-fns'
import type { ModoPartida, Partida } from '@/wss/validators/go'

export const ETIQUETA_MODO: Record<ModoPartida, string> = { partida: 'Partida por territorio', atari: 'Atari Go' }

export type InfoExport = {
  modo: ModoPartida
  negro: string
  blanco: string
  ganador: 'negro' | 'blanco' | null
  puntos: { negro: number; blanco: number } | null
}

export function infoExport(p: Pick<Partida, 'modo' | 'negro' | 'blanco' | 'ganadorUserId' | 'resultado'>): InfoExport {
  const ganador =
    p.ganadorUserId === null ? null : p.ganadorUserId === p.negro.userId ? 'negro' : 'blanco'

  return {
    modo: p.modo,
    negro: p.negro.nombre,
    blanco: p.blanco.nombre,
    ganador,
    puntos: p.resultado ? { negro: p.resultado.negro, blanco: p.resultado.blanco } : null,
  }
}

export function nombreImagenPartida(info: InfoExport, creadaEn: string): string {
  return `${info.negro} vs ${info.blanco} - ${format(new Date(creadaEn), 'dd/MM/yy - HH:mm')}.png`
}

/** Titular de la imagen de una partida terminada: quién ganó, o "Empate". */
export function tituloImagen(info: InfoExport): string {
  return info.ganador === null ? 'Empate' : `Ganó ${info[info.ganador]}`
}

export function subtituloImagen(info: InfoExport): string {
  return `${info.negro} vs ${info.blanco} · ${ETIQUETA_MODO[info.modo]}`
}
