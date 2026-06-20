/**
 * Lista las salas de redis: una por línea, con cantidad de preguntas y owner.
 *
 *   bun run wss/scripts/listar-salas.ts
 */
import redis from '../redis'

const salas = await redis.hgetall('salas')
const ids = Object.keys(salas)

const filas = await Promise.all(
  ids.map(async (id) => {
    const { profe } = JSON.parse(salas[id]) as { profe?: { email?: string } }
    const preguntas = await redis.scard(`sala:${id}:polls`)
    return { id, preguntas, owner: profe?.email ?? '—' }
  })
)

filas.sort((a, b) => b.preguntas - a.preguntas)

console.log(`${ids.length} sala(s):`)
for (const { id, preguntas, owner } of filas) {
  console.log(`${id}\t${preguntas} preguntas\t${owner}`)
}

await redis.quit()
