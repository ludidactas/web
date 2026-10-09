import { comandoAck, devuelve, sinPayload } from './definir'
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

export interface EventosGo {
  /** Una partida en la que estoy adentro (jugando u observando) cambió. */
  'go:partida': Partida
  'go:invitacion': Partida
  'go:invitacion_rechazada': { partidaId: string }
  /** Alguien de la sala entró o salió de una partida: la lista de contrincantes cambió. */
  'go:contrincantes_actualizados': ContrincanteGo[]
}
