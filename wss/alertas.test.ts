import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { avisarTelegram } from './alertas'

const fetchOriginal = globalThis.fetch
let fetchMock: ReturnType<typeof mock>
let n = 0
// Cada test usa su propia clave: la deduplicación es estado de módulo.
const clave = () => `test-${n++}`

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'token'
  process.env.TELEGRAM_CHAT_ID = '123'
  process.env.ENTORNO = 'staging'
  fetchMock = mock(async () => new Response('ok'))
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = fetchOriginal
  setSystemTime()
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
  delete process.env.ENTORNO
})

describe('avisarTelegram', () => {
  it('manda el mensaje al chat con el entorno', async () => {
    await avisarTelegram(clave(), 'hola')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.telegram.org/bottoken/sendMessage')
    expect(JSON.parse(init.body as string)).toEqual({ chat_id: '123', text: '🚨 wss (staging): hola' })
  })

  it('no hace nada si faltan las env vars', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    await avisarTelegram(clave(), 'hola')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('dedupea la misma clave dentro de la ventana y avisa de nuevo al vencer', async () => {
    const k = clave()
    setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await avisarTelegram(k, 'a')
    await avisarTelegram(k, 'b')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    setSystemTime(new Date('2026-01-01T00:01:01Z'))
    await avisarTelegram(k, 'c')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('claves distintas no se dedupean entre sí', async () => {
    await avisarTelegram(clave(), 'a')
    await avisarTelegram(clave(), 'b')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('si el fetch falla, no tira', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('red caída')
    })
    await expect(avisarTelegram(clave(), 'hola')).resolves.toBeUndefined()
  })

  it('le pasa al fetch una señal de timeout para no colgar el exit', async () => {
    await avisarTelegram(clave(), 'hola')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
