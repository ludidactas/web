import { afterEach, expect, jest, test } from 'bun:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import { DesafioSchema } from '../tipos'
import { DURACION_AYUDA_MS, useDesafioGo } from './use-desafio-go'

afterEach(() => {
  cleanup()
  jest.useRealTimers()
})

const desafio = DesafioSchema.parse({
  id: 'x',
  titulo: 'x',
  tamañoTablero: 9,
  jugadasCorrectas: [[1, 1]],
  explicacion: 'x',
})

test('pedir la ayuda mientras está visible no extiende su duración', () => {
  jest.useFakeTimers()
  const { result } = renderHook(() => useDesafioGo(desafio))

  act(() => void result.current.mostrarAyuda())
  act(() => jest.advanceTimersByTime(DURACION_AYUDA_MS - 100))
  act(() => void result.current.mostrarAyuda())
  expect(result.current.ayudaVisible).toBe(true)

  act(() => jest.advanceTimersByTime(100))
  expect(result.current.ayudaVisible).toBe(false)
})
