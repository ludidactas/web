import { format } from 'date-fns'
import type { Partida } from '@/wss/validators/go'

export type InfoExport = {
  negro: string
  blanco: string
  ganador: 'negro' | 'blanco' | null
  puntos: { negro: number; blanco: number } | null
}

export function infoExport(p: Pick<Partida, 'negro' | 'blanco' | 'ganadorUserId' | 'resultado'>): InfoExport {
  const ganador =
    p.ganadorUserId === null ? null : p.ganadorUserId === p.negro.userId ? 'negro' : 'blanco'

  return {
    negro: p.negro.nombre,
    blanco: p.blanco.nombre,
    ganador,
    puntos: p.resultado ? { negro: p.resultado.negro, blanco: p.resultado.blanco } : null,
  }
}

export function nombreImagenPartida(info: InfoExport, creadaEn: string): string {
  return `${info.negro} vs ${info.blanco} - ${format(new Date(creadaEn), 'dd/MM/yy - HH:mm')}.png`
}
