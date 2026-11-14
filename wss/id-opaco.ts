import { randomBytes } from 'crypto'
import redis from './redis'

/**
 * Id de una persona en una sala: al azar y estable dentro de la sala, para que reconexiones de la
 * misma identidad reciban el mismo id sin guardar la identidad real en los eventos que ven los
 * clientes. El mismo id se usa en votos, partidas y planilla; en otra sala la misma identidad recibe
 * otro.
 */
export async function idOpaco(salaId: string, identidad: string): Promise<string> {
  const clave = `sala:${salaId}:ids`
  await redis.hsetnx(clave, identidad, randomBytes(8).toString('hex'))
  const id = await redis.hget(clave, identidad)
  if (!id) throw new Error(`No se pudo resolver el id de la persona en la sala ${salaId}`)
  return id
}
