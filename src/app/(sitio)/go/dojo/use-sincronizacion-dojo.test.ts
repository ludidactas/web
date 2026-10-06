import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { StrictMode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

const ID = 'a'.repeat(32)
const PEDIDO = 'b'.repeat(32)
const GUARDADO = 'c'.repeat(32)
const COLECCION = 'ogs'
const CAPITULO = '01-fundamentos'

type Respuesta = { ok: true; data?: unknown } | { ok: false; error: string }

function crearSocket() {
  const oyentes = new Map<string, () => void>()
  const respuestas: Record<string, Respuesta> = { 'dojo:identificarse': { ok: true, data: ID } }
  const emitWithAck = mock(async (evento: string, _payload: unknown): Promise<Respuesta> => {
    return respuestas[evento] ?? { ok: true }
  })
  return {
    auth: {} as Record<string, unknown>,
    oyentes,
    respuestas,
    emitWithAck,
    on: (evento: string, fn: () => void) => oyentes.set(evento, fn),
    connect: () => oyentes.get('connect')?.(),
    disconnect: mock(),
    timeout: () => ({ emitWithAck }),
  }
}

let sockets: ReturnType<typeof crearSocket>[]
const handshake = mock(async (_auth: unknown, _opciones?: unknown) => {
  const socket = crearSocket()
  sockets.push(socket)
  return socket
})

mock.module('@/wss-cli/utils-socket-wss', () => ({ handshake }))

const { linkProgresoDojo, useSincronizacionDojo } = await import('./use-sincronizacion-dojo')

function irA(ruta: string) {
  window.happyDOM.setURL(`http://localhost${ruta}`)
}

const usar = (opciones?: { wrapper?: typeof StrictMode }) =>
  renderHook(() => useSincronizacionDojo(COLECCION, CAPITULO), opciones)

/** El socket con el que quedó la conexión (el último que creó el handshake). */
const ultimo = () => sockets.at(-1)!

beforeEach(() => {
  irA('/go/dojo')
  sockets = []
  handshake.mockClear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function idPresentado(llamada = 0) {
  return (handshake.mock.calls[llamada][0] as { idDojo?: string }).idDojo
}

describe('identificación', () => {
  test('presenta el id de la URL y lo saca de la URL', async () => {
    irA(`/go/dojo?id=${PEDIDO}`)
    localStorage.setItem('go-dojo-id', GUARDADO)
    const { result } = usar()

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(idPresentado()).toBe(PEDIDO)
    expect(window.location.search).toBe('')
  })

  test('el handshake es del rol dojo y se reconecta solo', async () => {
    const { result } = usar()
    await waitFor(() => expect(result.current.idDojo).toBe(ID))

    expect(handshake.mock.calls[0][0]).toEqual({ rol: 'dojo', idDojo: undefined })
    expect(handshake.mock.calls[0][1]).toEqual({ reconnection: true })
  })

  test('sin id en la URL presenta el de localStorage', async () => {
    localStorage.setItem('go-dojo-id', GUARDADO)
    const { result } = usar()

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(idPresentado()).toBe(GUARDADO)
  })

  test('un id con formato inválido no se presenta', async () => {
    irA('/go/dojo?id=dojo:*')
    localStorage.setItem('go-dojo-id', 'xyz')
    const { result } = usar()

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(idPresentado()).toBeUndefined()
  })

  test('el id de la URL sobrevive a que el efecto corra dos veces (StrictMode)', async () => {
    irA(`/go/dojo?id=${PEDIDO}`)
    const { result } = usar({ wrapper: StrictMode })

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(handshake.mock.calls.map((_, i) => idPresentado(i))).toEqual([PEDIDO, PEDIDO])
  })

  test('guarda el id emitido y habilita la sincronización', async () => {
    const { result } = usar()
    expect(result.current.sincronizacion).toBeUndefined()

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(localStorage.getItem('go-dojo-id')).toBe(ID)
    expect(result.current.sincronizacion).toBeDefined()
  })

  test('las reconexiones presentan el id definitivo', async () => {
    const { result } = usar()
    await waitFor(() => expect(result.current.idDojo).toBe(ID))

    expect(ultimo().auth).toEqual({ rol: 'dojo', idDojo: ID })
    await act(async () => ultimo().connect())
    expect(ultimo().emitWithAck.mock.calls.filter(([e]) => e === 'dojo:identificarse')).toHaveLength(2)
  })

  test('si no se puede identificar no hay sincronización', async () => {
    const consoleError = console.error
    console.error = mock()
    handshake.mockImplementationOnce(async () => {
      const socket = crearSocket()
      socket.respuestas['dojo:identificarse'] = { ok: false, error: 'redis caído' }
      sockets.push(socket)
      return socket
    })
    const { result } = usar()
    await waitFor(() => expect(ultimo().emitWithAck).toHaveBeenCalled())
    console.error = consoleError

    expect(result.current.sincronizacion).toBeUndefined()
  })

  test('al desmontar desconecta', async () => {
    const { result, unmount } = usar()
    await waitFor(() => expect(result.current.idDojo).toBe(ID))

    unmount()

    expect(ultimo().disconnect).toHaveBeenCalled()
  })
})

describe('espera', () => {
  test('espera hasta tener el id', async () => {
    const { result } = usar()
    expect(result.current.esperando).toBe(true)

    await waitFor(() => expect(result.current.idDojo).toBe(ID))
    expect(result.current.esperando).toBe(false)
  })

  test('deja de esperar si falla la conexión', async () => {
    handshake.mockImplementationOnce(async () => {
      const socket = crearSocket()
      socket.connect = () => socket.oyentes.get('connect_error')?.()
      sockets.push(socket)
      return socket
    })
    const { result } = usar()

    await waitFor(() => expect(result.current.esperando).toBe(false))
    expect(result.current.sincronizacion).toBeUndefined()
  })

  test('deja de esperar si no se puede identificar', async () => {
    const consoleError = console.error
    console.error = mock()
    handshake.mockImplementationOnce(async () => {
      const socket = crearSocket()
      socket.respuestas['dojo:identificarse'] = { ok: false, error: 'redis caído' }
      sockets.push(socket)
      return socket
    })
    const { result } = usar()

    await waitFor(() => expect(result.current.esperando).toBe(false))
    console.error = consoleError
  })
})

describe('sincronización', () => {
  test('envía los comandos con ack, colección y capítulo', async () => {
    const { result } = usar()
    await waitFor(() => expect(result.current.sincronizacion).toBeDefined())

    result.current.sincronizacion!.marcarResuelto('a')
    result.current.sincronizacion!.guardarActual('b')

    await waitFor(() => {
      expect(ultimo().emitWithAck).toHaveBeenCalledWith('dojo:resuelto', { coleccion: COLECCION, capitulo: CAPITULO, desafio: 'a' })
      expect(ultimo().emitWithAck).toHaveBeenCalledWith('dojo:actual', { coleccion: COLECCION, capitulo: CAPITULO, desafio: 'b' })
    })
  })

  test('una escritura rechazada se loguea y no rompe', async () => {
    const { result } = usar()
    await waitFor(() => expect(result.current.sincronizacion).toBeDefined())
    const error = mock()
    const consoleError = console.error
    console.error = error
    ultimo().respuestas['dojo:resuelto'] = { ok: false, error: 'sin conexión' }

    result.current.sincronizacion!.marcarResuelto('a')
    await waitFor(() => expect(error).toHaveBeenCalled())
    console.error = consoleError
  })

  test('sincronizar rechaza con el error del ack', async () => {
    const { result } = usar()
    await waitFor(() => expect(result.current.sincronizacion).toBeDefined())
    ultimo().respuestas['dojo:sincronizar'] = { ok: false, error: 'sin conexión' }

    await expect(result.current.sincronizacion!.sincronizar(['a'])).rejects.toThrow('sin conexión')
    expect(ultimo().emitWithAck).toHaveBeenCalledWith('dojo:sincronizar', {
      coleccion: COLECCION,
      capitulo: CAPITULO,
      resueltos: ['a'],
    })
  })
})

test('linkProgresoDojo', () => {
  expect(linkProgresoDojo(ID)).toBe(`${window.location.origin}/go/dojo?id=${ID}`)
})
