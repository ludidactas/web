const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const ENTORNO = process.env.ENTORNO || 'staging'

const VENTANA_MS = 60_000
const ultimoAviso = new Map<string, number>()

/**
 * Avisa un error grave a Telegram, dedupeado por `clave` dentro de una ventana de 1 minuto: Redis
 * reintentando conexión o un error de middleware repitiéndose por un cliente en loop no debe floodear
 * el chat. No hace nada si faltan las env vars (local/tests). Nunca tira: un fallo de red acá no puede
 * tapar ni agravar el error original que se está avisando.
 */
export const avisarTelegram = async (clave: string, mensaje: string): Promise<void> => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return

  const ahora = Date.now()
  const ultimo = ultimoAviso.get(clave) ?? 0
  if (ahora - ultimo < VENTANA_MS) return
  ultimoAviso.set(clave, ahora)

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🚨 wss (${ENTORNO}): ${mensaje}` }),
    })
  } catch (err) {
    console.error('❌ No se pudo avisar a Telegram:', err)
  }
}
