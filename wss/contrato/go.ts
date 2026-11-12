import { z } from 'zod'
import { comandoAck, devuelve, sinPayload } from './definir'
import type { PartidaDrivePendiente } from '../go/db'
import { invitacionSchema, jugadaSchema, partidaIdSchema, type ContrincanteGo, type Partida } from '../validators/go'

/** Comandos de Go de una conexión: estudiante y profe comparten la mecánica, cambia la identidad. */
export const comandosGo = {
  'go:contrincantes': comandoAck(sinPayload, devuelve<ContrincanteGo[]>()),
  /** Mi partida activa (pendiente o en curso), o `null`. */
  'go:mi_partida': comandoAck(sinPayload, devuelve<Partida | null>()),
  'go:observar': comandoAck(partidaIdSchema, devuelve<Partida>()),
  'go:dejar_observar': comandoAck(partidaIdSchema, devuelve<void>()),
  'go:invitar': comandoAck(invitacionSchema, devuelve<Partida>()),
  'go:aceptar': comandoAck(partidaIdSchema, devuelve<Partida>()),
  /** También cancela una invitación propia todavía pendiente. */
  'go:rechazar': comandoAck(partidaIdSchema, devuelve<void>()),
  'go:jugar': comandoAck(jugadaSchema, devuelve<Partida>()),
  'go:pasar': comandoAck(partidaIdSchema, devuelve<Partida>()),
  'go:marcar_muerta': comandoAck(jugadaSchema, devuelve<Partida>()),
  'go:confirmar_conteo': comandoAck(partidaIdSchema, devuelve<Partida>()),
  'go:abandonar': comandoAck(partidaIdSchema, devuelve<Partida>()),
}

export const comandosGoDriveProfe = {
  'go:partidas_drive_pendientes': comandoAck(sinPayload, devuelve<PartidaDrivePendiente[]>()),
  'go:descartar_partidas_drive': comandoAck(z.object({ ids: z.array(z.string()) }), devuelve<void>()),
}

export interface EventosGo {
  /** Una partida en la que estoy adentro (jugando u observando) cambió. */
  'go:partida': Partida
  'go:invitacion': Partida
  'go:invitacion_rechazada': { partidaId: string }
  /** Alguien de la sala entró o salió de una partida: la lista de contrincantes cambió. */
  'go:contrincantes_actualizados': ContrincanteGo[]
}
