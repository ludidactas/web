import { beforeEach, describe, expect, test } from 'bun:test'
import { jugarLocal, nuevaPartidaLocal } from './partida-local'
import { storeTableroLocal } from './store-tablero'

const CLAVE = 'go-tablero-local'
const store = () => storeTableroLocal.getState()
const actual = () => store().partidas[store().tamaño]
const todasNuevas = () => ({ 9: nuevaPartidaLocal(9), 13: nuevaPartidaLocal(13), 19: nuevaPartidaLocal(19) })

describe('storeTableroLocal', () => {
  beforeEach(() => {
    localStorage.clear()
    storeTableroLocal.setState({ tamaño: 9, partidas: todasNuevas() })
  })

  test('empieza en 9x9 con los tres tableros vacíos, en modo partida', () => {
    expect(store().tamaño).toBe(9)
    for (const t of [9, 13, 19] as const) {
      expect(store().partidas[t].tamaño).toBe(t)
      expect(store().partidas[t].modo).toBe('partida')
      expect(store().partidas[t].historial).toHaveLength(0)
    }
  })

  test('cambiar de tamaño conserva lo que había en cada tablero', () => {
    store().setPartida(jugarLocal(actual(), 4, 4))
    store().setTamaño(13)
    expect(actual().historial).toHaveLength(0)
    store().setPartida(jugarLocal(actual(), 6, 6))

    store().setTamaño(9)
    expect(actual().tablero[4][4]).toBe('N')
    store().setTamaño(13)
    expect(actual().tablero[6][6]).toBe('N')
  })

  test('nueva partida en modo atari reemplaza solo el tablero que se está mirando, con la cruz inicial', () => {
    store().setPartida(jugarLocal(actual(), 0, 0))
    store().setTamaño(13)
    store().setPartida(jugarLocal(actual(), 6, 6))

    store().nuevaPartida('atari')
    expect(actual().modo).toBe('atari')
    expect(actual().historial).toHaveLength(0)
    expect(actual().tablero[6][6]).toBe('N') // cruz inicial de 13x13 (centro en 6)
    expect(actual().tablero[5][5]).toBe('N')

    store().setTamaño(9)
    expect(actual().modo).toBe('partida')
    expect(actual().tablero[0][0]).toBe('N')
  })

  test('nueva partida en el mismo modo vacía el tablero', () => {
    store().setPartida(jugarLocal(actual(), 4, 4))
    store().nuevaPartida('partida')
    expect(actual().historial).toHaveLength(0)
    expect(actual().tablero[4][4]).toBe('.')
  })

  test('guarda tamaño y partidas (con su modo) en localStorage cada vez que cambian', () => {
    store().setPartida(jugarLocal(actual(), 4, 4))
    store().setTamaño(19)
    store().nuevaPartida('atari')

    const guardado = JSON.parse(localStorage.getItem(CLAVE)!)
    expect(guardado.version).toBe(4)
    expect(guardado.state.tamaño).toBe(19)
    expect(guardado.state.partidas[9].tablero[4][4]).toBe('N')
    expect(guardado.state.partidas[19].modo).toBe('atari')
  })

  test('recupera lo guardado al rehidratar', async () => {
    const partida = jugarLocal(nuevaPartidaLocal(13, 'atari'), 3, 3)
    // Página recién cargada: hay algo guardado y el store todavía no lo leyó.
    localStorage.setItem(
      CLAVE,
      JSON.stringify({ version: 4, state: { tamaño: 13, partidas: { ...todasNuevas(), 13: partida } } })
    )
    expect(store().tamaño).toBe(9)

    await storeTableroLocal.persist.rehydrate()

    expect(store().tamaño).toBe(13)
    expect(actual()).toEqual(partida)
  })

  test('descarta lo guardado con otra versión', async () => {
    localStorage.setItem(CLAVE, JSON.stringify({ version: 3, state: { tamaño: 13, partidas: todasNuevas() } }))
    await storeTableroLocal.persist.rehydrate()

    expect(store().tamaño).toBe(9)
    expect(actual().historial).toHaveLength(0)
  })
})
