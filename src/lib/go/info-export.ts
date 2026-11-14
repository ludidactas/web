import { format } from 'date-fns'
import type { ModoPartida, Partida, PartidaPublica } from '@/wss/validators/go'

export const ETIQUETA_MODO: Record<ModoPartida, string> = { partida: 'Partida por territorio', atari: 'Atari Go' }

export type InfoExport = {
  modo: ModoPartida
  negro: string
  blanco: string
  ganador: 'negro' | 'blanco' | null
  puntos: { negro: number; blanco: number } | null
}

/** La partida completa del server (ids reales) o la vista pública que llega al cliente (ids opacos). */
type PartidaParaExportar =
  | Pick<Partida, 'modo' | 'negro' | 'blanco' | 'ganadorUserId' | 'resultado'>
  | Pick<PartidaPublica, 'modo' | 'negro' | 'blanco' | 'ganadorId' | 'resultado'>

export function infoExport(p: PartidaParaExportar): InfoExport {
  const ganador =
    'ganadorId' in p
      ? p.ganadorId === null
        ? null
        : p.ganadorId === p.negro.id
          ? 'negro'
          : 'blanco'
      : p.ganadorUserId === null
        ? null
        : p.ganadorUserId === p.negro.userId
          ? 'negro'
          : 'blanco'

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

/** "16/10/26" */
export const fechaCorta = (fecha: Date) => format(fecha, 'dd/MM/yy')

/** Modo y día en que se jugó (`creadaEn` en ISO), y al final los jugadores: si no entra, se recorta por ahí. */
export function subtituloImagen(info: InfoExport, creadaEn: string): string {
  return `${ETIQUETA_MODO[info.modo]} el ${fechaCorta(new Date(creadaEn))} · ${info.negro} vs ${info.blanco}`
}
