import { describe, expect, test } from 'bun:test'
import { getDesafiosEjemplo } from '.'
import { rival } from '@/lib/go/motor'
import { aplicarJugada, evaluarJugada } from '../motor-desafio'
import type { Desafio } from '../tipos'

// Parsea la colección "ejemplo" y verifica que las jugadas correctas capturan lo que deberían y que
// jugadas al azar no se marcan como correctas por error — mismo chequeo que go-dojo-engine/test/sanity.ts,
// portado al runner del repo (bun:test) en vez de un script suelto.
const desafios = getDesafiosEjemplo()

function porId(id: string): Desafio {
  const d = desafios.find((d) => d.id === id)
  if (!d) throw new Error(`desafío de ejemplo no encontrado: ${id}`)
  return d
}

test('el YAML de ejemplo parsea sin errores', () => {
  expect(desafios.length).toBeGreaterThan(0)
})

describe('desafíos tipo: "jugada"', () => {
  const conJugadasCorrectas = desafios.filter((d) => d.tipo === 'jugada' && d.jugadasCorrectas?.length)

  test.each(conJugadasCorrectas.map((d) => [d.id, d] as const))('%s: la jugada listada en jugadasCorrectas es correcta', (_id, d) => {
    const [r, col] = d.jugadasCorrectas![0]
    const resultado = evaluarJugada(d, r, col)
    expect(resultado?.esCorrecta).toBe(true)
  })

  test.each(conJugadasCorrectas.map((d) => [d.id, d] as const))('%s: (0,0) no registra como correcta si no es la jugada esperada', (_id, d) => {
    if (d.piedras.some((p) => p.r === 0 && p.c === 0)) return // ocupado en este desafío, no aplica
    const resultado = evaluarJugada(d, 0, 0)
    expect(resultado?.esCorrecta).toBeFalsy()
  })

  test('capturar-una-piedra: captura exactamente 1 piedra', () => {
    const resultado = evaluarJugada(porId('capturar-una-piedra'), 4, 5)!
    expect(resultado.capturadas.size).toBe(1)
  })

  // Posición asimétrica a propósito (fila fija en 3, columnas 3 y 5): si el motor compartido con
  // motor.ts (que habla en [x,y] = [columna,fila]) se convirtiera mal a clavePunto(fila,columna), acá
  // se vería como una captura fantasma en "5,3" en vez de las reales "3,3"/"3,5" — el tamaño solo no
  // lo detectaría porque (3,3) es simétrico y sigue dando el mismo resultado en ambos sentidos.
  test('captura-doble: captura exactamente las piedras blancas en (3,3) y (3,5), no sus coordenadas transpuestas', () => {
    const resultado = evaluarJugada(porId('captura-doble'), 3, 4)!
    expect(resultado.capturadas).toEqual(new Set(['3,3', '3,5']))
  })
})

describe('desafío tipo: "exploracion"', () => {
  const exploracion = desafios.find((d) => d.tipo === 'exploracion')

  test('hay al menos un desafío exploracion en el ejemplo', () => {
    expect(exploracion).toBeDefined()
  })

  test('cada desenlace listado matchea su propio punto', () => {
    for (const de of exploracion!.desenlaces ?? []) {
      const resultado = evaluarJugada(exploracion!, de.en[0], de.en[1])
      expect(resultado?.esCorrecta).toBe(de.correcto)
      expect(resultado?.desenlace?.texto).toBe(de.texto)
    }
  })

  test('un punto sin marcar queda incorrecto y sin desenlace', () => {
    const resultado = evaluarJugada(exploracion!, 10, 10)
    expect(resultado?.esCorrecta).toBeFalsy()
    expect(resultado?.desenlace).toBeUndefined()
  })
})

describe('desafío tipo: "secuencia"', () => {
  const desafioSecuencia = desafios.find((d) => d.tipo === 'secuencia')

  test('hay al menos un desafío secuencia en el ejemplo', () => {
    expect(desafioSecuencia?.secuencia).toBeDefined()
  })

  test('la raíz tiene una rama incorrecta terminal en (0,0)', () => {
    const raizIncorrecta = desafioSecuencia!.secuencia!.ramas.find((b) => b.en[0] === 0 && b.en[1] === 0)
    expect(raizIncorrecta).toBeDefined()
    expect(raizIncorrecta!.correcto).toBe(false)
    expect(raizIncorrecta!.siguiente).toBeUndefined()
  })

  test('la raíz tiene una rama correcta que continúa, y recorrerla aplica jugada + respuesta del rival', () => {
    const { piedras, turno, tamañoTablero, secuencia } = desafioSecuencia!
    const raizCorrecta = secuencia!.ramas.find((b) => !(b.en[0] === 0 && b.en[1] === 0))!
    expect(raizCorrecta.correcto).toBe(true)
    expect(raizCorrecta.siguiente).toBeDefined()

    const trasEstudiante = aplicarJugada(piedras, raizCorrecta.en[0], raizCorrecta.en[1], turno, tamañoTablero)
    let tablero = trasEstudiante.piedras
    if (raizCorrecta.respuestaRival) {
      const [rr, rc] = raizCorrecta.respuestaRival
      tablero = aplicarJugada(tablero, rr, rc, rival(turno), tamañoTablero).piedras
    }
    const esperadas = piedras.length + (raizCorrecta.respuestaRival ? 2 : 1)
    expect(tablero.length).toBe(esperadas)

    const siguiente = raizCorrecta.siguiente!
    expect(siguiente.ramas.some((b) => b.correcto && !b.siguiente)).toBe(true)
    expect(siguiente.ramas.some((b) => !b.correcto && !b.siguiente)).toBe(true)
  })
})
