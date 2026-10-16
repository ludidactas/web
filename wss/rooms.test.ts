import { expect, test } from 'bun:test'
import { rooms } from './rooms'

// El formato es el que comparten todas las instancias del wss (adapter de Redis): no cambia.
test('formato de los rooms', () => {
  expect(rooms.sala('s1')).toBe('sala:s1')
  expect(rooms.profe('s1')).toBe('sala:s1:profe')
  expect(rooms.estudiantes('s1')).toBe('sala:s1:estudiantes')
  expect(rooms.publico('s1')).toBe('sala:s1:publico')
  expect(rooms.overlay('s1')).toBe('sala:s1:overlay')
  expect(rooms.usuario('s1', 'ana')).toBe('sala:s1:ana')
  expect(rooms.cuentaProfe('a@b.com')).toBe('profe:a@b.com')
  expect(rooms.partidaGo('s1', 'p1')).toBe('sala:s1:go:p1')
})
