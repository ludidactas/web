/**
 * Lista las salas de redis: una por línea, con cantidad de preguntas y owner.
 *
 *   bun run wss/scripts/listar-salas.ts
 */
import redis from '../redis'
import { configSala, salaData } from '../validators/salas'

// Matchea el esquema actual = parsea Y la config no tiene claves de más (p.ej. `esquema` legacy).
const esquemaActual = salaData.extend({ config: configSala.strict() })

const salas = await redis.hgetall('salas')
const ids = Object.keys(salas)

const filas = await Promise.all(
  ids.map(async (id) => {
    const raw = JSON.parse(salas[id]) as { profe?: { email?: string } }
    const preguntas = await redis.scard(`sala:${id}:polls`)
    return { id, preguntas, owner: raw.profe?.email ?? '—', matchea: esquemaActual.safeParse(raw).success }
  })
)

filas.sort((a, b) => b.preguntas - a.preguntas)

console.log(`${ids.length} sala(s):`)
for (const { id, preguntas, owner, matchea } of filas) {
  console.log(`${matchea ? '✓' : '✗'}\t${id}\t${preguntas} preguntas\t${owner}`)
}

await redis.quit()
