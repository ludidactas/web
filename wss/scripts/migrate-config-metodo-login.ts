/**
 * Migración one-off: config de sala de booleans (`pedir_dni`/`permitir_anonimo`) → `metodo_login`.
 *
 * Es el ÚNICO lugar del repo que conoce el shape viejo de la config. Corte limpio: el runtime ya
 * asume el shape nuevo, así que este script DEBE correrse una vez antes de deployar el cambio.
 *
 *   bun run wss/scripts/migrate-config-metodo-login.ts            # aplica la migración
 *   bun run wss/scripts/migrate-config-metodo-login.ts --dry-run  # solo reporta, no escribe
 *
 * Idempotente: una sala que ya tiene `metodo_login` se saltea. Hacer backup de redis antes en prod.
 */
import redis from '../redis'
import { MetodosLogin } from '../validators/auth'

// Shape viejo de la config (solo vive acá).
interface ConfigVieja {
  pedir_dni?: boolean
  permitir_anonimo?: boolean
  solo_invitados?: boolean
  nombre_profe: string
  link: string
  metodo_login?: MetodosLogin
}

/** Mapea los booleans viejos al metodo_login nuevo. Google no existe en datos viejos. */
function metodoLoginDesdeBooleans(config: ConfigVieja): MetodosLogin {
  return config.pedir_dni ? MetodosLogin.DNI : MetodosLogin.Nombre
}

async function migrar() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`🔧 Migrando config de salas a 'metodo_login'${dryRun ? ' (dry-run)' : ''}...`)

  const salas = await redis.hgetall('salas')
  const ids = Object.keys(salas)
  console.log(`   ${ids.length} sala(s) en redis.`)

  let migradas = 0
  let salteadas = 0

  for (const id of ids) {
    const salaData = JSON.parse(salas[id]) as { id: string; profe: unknown; config: ConfigVieja }
    const config = salaData.config

    // Idempotencia: si ya tiene metodo_login (y no quedan booleans), no la tocamos.
    if (config.metodo_login && config.pedir_dni === undefined && config.permitir_anonimo === undefined) {
      salteadas++
      continue
    }

    const metodo_login = config.metodo_login ?? metodoLoginDesdeBooleans(config)

    const nuevaConfig = {
      metodo_login,
      solo_invitados: config.solo_invitados ?? false,
      nombre_profe: config.nombre_profe,
      link: config.link,
    }

    console.log(
      `   ${id}: { pedir_dni: ${config.pedir_dni}, permitir_anonimo: ${config.permitir_anonimo} } → metodo_login: '${metodo_login}'`
    )

    if (!dryRun) {
      await redis.hset('salas', id, JSON.stringify({ ...salaData, config: nuevaConfig }))
    }
    migradas++
  }

  console.log(`✅ Listo. ${migradas} migrada(s), ${salteadas} ya estaban al día.`)
  await redis.quit()
}

migrar().catch((err) => {
  console.error('❌ Falló la migración:', err)
  process.exit(1)
})
