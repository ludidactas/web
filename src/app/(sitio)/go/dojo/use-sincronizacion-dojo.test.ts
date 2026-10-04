import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

const ID = 'a'.repeat(32)

function crearSocket() {
  const oyentes = new Map<string, () => void>()
  const emitWithAck = mock(async (evento: string, _payload: unknown): Promise<unknown> => {
    if (evento === 'dojo:identificarse') return { ok: true, data: ID }
    return { ok: false, error: 'sin conexión' }
  })
  return {
    oyentes,
    emitWithAck,
    on: (evento: string, fn: () => void) => oyentes.set(evento, fn),
    connect: () => oyentes.get('connect')?.(),
    disconnect: mock(),
    emit: mock(),
    timeout: () => ({ emitWithAck }),
  }
}

let socket: ReturnType<typeof crearSocket>
const handshake = mock(async () => socket)

mock.module('@/wss-cli/utils-socket-wss', () => ({ handshake }))

const { linkProgresoDojo, useSincronizacionDojo } = await import('./use-sincronizacion-dojo')

function irA(ruta: string) {
  window.happyDOM.setURL(`http://localhost${ruta}`)
}

beforeEach(() => {
  irA('/go/dojo')
  socket = crearSocket()
  handshake.mockClear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function idPedido(llamada = 0) {
  const identificaciones = socket.emitWithAck.mock.calls.filter(([evento]) => evento === 'dojo:identificarse')
  return (identificaciones[llamada][1] as { idDojo?: string }).idDojo
}

describe('identificación', () => {
  test('pide el id de la URL y lo saca de la URL', async () => {
    irA('/go/dojo?id=b')
    localStorage.setItem('go-dojo-id', 'c')
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(idPedido()).toBe('b')
    expect(window.location.search).toBe('')
  })

  test('sin id en la URL pide el de localStorage', async () => {
    localStorage.setItem('go-dojo-id', 'c')
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(idPedido()).toBe('c')
  })

  test('guarda el id emitido y habilita la sincronización', async () => {
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))
    expect(result.current.sincronizacion).toBeUndefined()

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(localStorage.getItem('go-dojo-id')).toBe(ID)
    expect(result.current.sincronizacion).toBeDefined()
  })

  test('al reconectar pide el id obtenido', async () => {
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))
    await waitFor(() => expect(result.current.idDojo).toBe(ID))

    await act(async () => socket.connect())

    expect(idPedido(1)).toBe(ID)
  })

  test('al desmontar desconecta', async () => {
    const { result, unmount } = renderHook(() => useSincronizacionDojo('01-fundamentos'))
    await waitFor(() => expect(result.current.idDojo).toBe(ID))

    unmount()

    expect(socket.disconnect).toHaveBeenCalled()
  })
})

describe('sincronización', () => {
  test('emite los comandos con el capítulo', async () => {
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))
    await waitFor(() => expect(result.current.sincronizacion).toBeDefined())

    result.current.sincronizacion!.marcarResuelto('a')
    result.current.sincronizacion!.guardarActual('b')

    expect(socket.emit).toHaveBeenCalledWith('dojo:resuelto', { capitulo: '01-fundamentos', desafio: 'a' })
    expect(socket.emit).toHaveBeenCalledWith('dojo:actual', { capitulo: '01-fundamentos', desafio: 'b' })
  })

  test('sincronizar rechaza con el error del ack', async () => {
    const { result } = renderHook(() => useSincronizacionDojo('01-fundamentos'))
    await waitFor(() => expect(result.current.sincronizacion).toBeDefined())

    await expect(result.current.sincronizacion!.sincronizar(['a'])).rejects.toThrow('sin conexión')
    expect(socket.emitWithAck).toHaveBeenCalledWith('dojo:sincronizar', {
      capitulo: '01-fundamentos',
      resueltos: ['a'],
    })
  })
})

test('linkProgresoDojo', () => {
  expect(linkProgresoDojo(ID)).toBe(`${window.location.origin}/go/dojo?id=${ID}`)
})
