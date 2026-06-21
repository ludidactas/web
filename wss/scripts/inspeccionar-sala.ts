/**
 * Dumpea el JSON crudo de una sala de redis (tal cual está guardado).
 *
 *   bun run wss/scripts/inspeccionar-sala.ts <salaId>
 */
import redis from '../redis'

const id = process.argv[2]
if (!id) {
  console.error('Uso: bun run wss:inspeccionar <salaId>')
  process.exit(1)
}

const str = await redis.hget('salas', id)
if (!str) {
  console.error(`No existe la sala ${id}`)
  process.exit(1)
}

console.log(JSON.stringify(JSON.parse(str), null, 2))

await redis.quit()
