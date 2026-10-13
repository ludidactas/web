import { comandoAck, devuelve, sinPayload } from './definir'
import { desafioDojoSchema, sincronizarDojoSchema, type ProgresoDojoRemoto } from '../validators/dojo'

/** Comandos del visitante anónimo del dojo de Go. Todos responden por ack. */
export const comandosDojo = {
  /** Devuelve el id definitivo del visitante (el pedido en el pasaporte, o uno nuevo). */
  'dojo:identificarse': comandoAck(sinPayload, devuelve<string>()),
  /** Suma los resueltos locales del capítulo y devuelve el progreso remoto resultante. */
  'dojo:sincronizar': comandoAck(sincronizarDojoSchema, devuelve<ProgresoDojoRemoto>()),
  'dojo:resuelto': comandoAck(desafioDojoSchema, devuelve<void>()),
  'dojo:actual': comandoAck(desafioDojoSchema, devuelve<void>()),
}
