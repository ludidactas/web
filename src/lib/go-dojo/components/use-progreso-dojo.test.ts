import { afterEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useProgresoDojo, type SincronizacionDojo } from './use-progreso-dojo'

const CLAVE = 'test-progreso-dojo'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function guardar(resueltos: string[], actual: string | null) {
  localStorage.setItem(CLAVE, JSON.stringify({ resueltos, actual }))
}

function leer() {
  return JSON.parse(localStorage.getItem(CLAVE)!)
}

function sincronizacionCon(sincronizar: SincronizacionDojo['sincronizar']) {
  return { sincronizar: mock(sincronizar), marcarResuelto: mock(), guardarActual: mock() }
}

describe('sin sincronización', () => {
  test('carga lo guardado en localStorage', async () => {
    guardar(['a'], 'a')
    const { result } = renderHook(() => useProgresoDojo(CLAVE))

    await waitFor(() => expect(result.current.cargado).toBe(true))
    expect(result.current.resueltos).toEqual(new Set(['a']))
    expect(result.current.actualGuardado).toBe('a')
  })
})

describe('con sincronización', () => {
  test('no está cargado hasta que responde la sincronización', async () => {
    let responder!: (r: { resueltos: string[]; actual: string | null }) => void
    const sincronizacion = sincronizacionCon(() => new Promise((r) => (responder = r)))
    const { result } = renderHook(() => useProgresoDojo(CLAVE, sincronizacion))

    await waitFor(() => expect(sincronizacion.sincronizar).toHaveBeenCalled())
    expect(result.current.cargado).toBe(false)

    await act(async () => responder({ resueltos: [], actual: null }))
    expect(result.current.cargado).toBe(true)
  })

  test('sube lo local y se queda con la unión', async () => {
    guardar(['a', 'b'], 'b')
    const sincronizacion = sincronizacionCon(async () => ({ resueltos: ['b', 'c'], actual: 'c' }))
    const { result } = renderHook(() => useProgresoDojo(CLAVE, sincronizacion))

    await waitFor(() => expect(result.current.cargado).toBe(true))
    expect(sincronizacion.sincronizar).toHaveBeenCalledWith(['a', 'b'])
    expect(result.current.resueltos).toEqual(new Set(['a', 'b', 'c']))
    expect(result.current.actualGuardado).toBe('c')
    expect(leer()).toEqual({ resueltos: ['a', 'b', 'c'], actual: 'c' })
  })

  test('sin actual remoto conserva el local', async () => {
    guardar(['a'], 'a')
    const sincronizacion = sincronizacionCon(async () => ({ resueltos: [], actual: null }))
    const { result } = renderHook(() => useProgresoDojo(CLAVE, sincronizacion))

    await waitFor(() => expect(result.current.cargado).toBe(true))
    expect(result.current.actualGuardado).toBe('a')
  })

  test('si falla la sincronización queda cargado con lo local', async () => {
    guardar(['a'], 'a')
    const error = mock()
    const consoleError = console.error
    console.error = error
    const sincronizacion = sincronizacionCon(async () => {
      throw new Error('sin conexión')
    })
    const { result } = renderHook(() => useProgresoDojo(CLAVE, sincronizacion))

    await waitFor(() => expect(result.current.cargado).toBe(true))
    console.error = consoleError
    expect(error).toHaveBeenCalled()
    expect(result.current.resueltos).toEqual(new Set(['a']))
    expect(result.current.actualGuardado).toBe('a')
  })

  test('propaga resueltos y actual', async () => {
    const sincronizacion = sincronizacionCon(async () => ({ resueltos: [], actual: null }))
    const { result } = renderHook(() => useProgresoDojo(CLAVE, sincronizacion))
    await waitFor(() => expect(result.current.cargado).toBe(true))

    act(() => {
      result.current.marcarResuelto('a')
      result.current.guardarActual('b')
      result.current.guardarActual(null)
    })

    expect(sincronizacion.marcarResuelto).toHaveBeenCalledWith('a')
    expect(sincronizacion.guardarActual).toHaveBeenCalledTimes(1)
    expect(sincronizacion.guardarActual).toHaveBeenCalledWith('b')
  })
})
