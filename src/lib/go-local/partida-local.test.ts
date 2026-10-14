import { describe, expect, test } from 'bun:test'
import { BLANCO, JugadaInvalida, NEGRO } from '@/lib/go/motor'
import {
  alternarConformidadLocal,
  jugarLocal,
  marcarMuertaLocal,
  nuevaPartidaLocal,
  pasarLocal,
  type PartidaLocal,
} from './partida-local'

const jugadas = (partida: PartidaLocal, ...puntos: [number, number][]) =>
  puntos.reduce((p, [f, c]) => jugarLocal(p, f, c), partida)

describe('partida local', () => {
  test('empieza negro y los turnos se alternan', () => {
    const p0 = nuevaPartidaLocal(9)
    expect(p0.turno).toBe(NEGRO)

    const p1 = jugarLocal(p0, 4, 4)
    expect(p1.turno).toBe(BLANCO)
    expect(p1.tablero[4][4]).toBe(NEGRO)
    expect(p0.tablero[4][4]).toBe('.') // no muta la partida anterior
  })

  test('jugar en un punto ocupado es una jugada inválida', () => {
    const p = jugarLocal(nuevaPartidaLocal(9), 4, 4)
    expect(() => jugarLocal(p, 4, 4)).toThrow(JugadaInvalida)
  })

  test('una captura suma al color que la hizo', () => {
    // Negro rodea la blanca de (0,0): N(0,1), B(0,0), N(1,0) la captura.
    const p = jugadas(nuevaPartidaLocal(9), [0, 1], [0, 0], [1, 0])
    expect(p.tablero[0][0]).toBe('.')
    expect(p.capturasNegras).toBe(1)
    expect(p.capturasBlancas).toBe(0)
  })

  test('el ko impide recapturar de inmediato', () => {
    // Ko en el centro: la blanca de (2,2) queda con una única libertad, (2,3). Negro la captura jugando
    // ahí, y blanco no puede volver a (2,2) porque repetiría la posición anterior.
    const p = jugadas(
      nuevaPartidaLocal(9),
      [1, 2],
      [1, 3], // N, B
      [2, 1],
      [2, 4], // N, B
      [3, 2],
      [3, 3], // N, B
      [8, 8],
      [2, 2], // N juega lejos, B entra en (2,2)
      [2, 3] // N captura (2,2)
    )
    expect(p.capturasNegras).toBe(1)
    expect(() => jugarLocal(p, 2, 2)).toThrow(JugadaInvalida)

    // Tras una jugada en otra parte, la recaptura vuelve a ser legal.
    const despues = jugadas(p, [7, 7], [6, 6])
    expect(despues.turno).toBe(BLANCO)
    expect(jugarLocal(despues, 2, 2).capturasBlancas).toBe(1)
  })

  test('dos pases seguidos abren el conteo; una jugada entre medio reinicia la cuenta', () => {
    const tras1Pase = pasarLocal(jugarLocal(nuevaPartidaLocal(9), 4, 4))
    expect(tras1Pase.fase).toBe('jugando')

    const jugoEntre = jugarLocal(tras1Pase, 2, 2)
    expect(jugoEntre.pases).toBe(0)

    const conteo = pasarLocal(pasarLocal(jugoEntre))
    expect(conteo.fase).toBe('contando')
    expect(conteo.removidas).not.toBeNull()
    expect(() => jugarLocal(conteo, 0, 0)).toThrow(JugadaInvalida)
  })

  test('el conteo marca una piedra como muerta y el resultado incluye territorio y komi', () => {
    // Una piedra blanca suelta y una negra: marcar la blanca como muerta deja todo el tablero para negro.
    let p = jugadas(nuevaPartidaLocal(9), [4, 4], [0, 0])
    p = pasarLocal(pasarLocal(p))
    p = marcarMuertaLocal(p, 0, 0)
    expect(p.removidas![0][0]).toBe(true)

    // Alternar de nuevo la restaura.
    expect(marcarMuertaLocal(p, 0, 0).removidas![0][0]).toBe(false)

    const fin = alternarConformidadLocal(alternarConformidadLocal(p, NEGRO), BLANCO)
    expect(fin.fase).toBe('terminada')
    expect(fin.resultado?.ganador).toBe('negro')
  })

  test('marcar un punto sin piedra en el conteo es inválido', () => {
    const p = pasarLocal(pasarLocal(jugarLocal(nuevaPartidaLocal(9), 4, 4)))
    expect(() => marcarMuertaLocal(p, 0, 0)).toThrow(JugadaInvalida)
  })

  describe('conformidad con el conteo', () => {
    const enConteo = () => pasarLocal(pasarLocal(jugadas(nuevaPartidaLocal(9), [4, 4], [0, 0])))

    test('el conteo empieza sin conformidades y una sola no termina la partida', () => {
      const p = enConteo()
      expect(p.confirmaron).toEqual({ negro: false, blanco: false })

      const conNegro = alternarConformidadLocal(p, NEGRO)
      expect(conNegro.confirmaron).toEqual({ negro: true, blanco: false })
      expect(conNegro.fase).toBe('contando')
      expect(conNegro.resultado).toBeNull()
    })

    test('tocar de nuevo retira la conformidad', () => {
      const retirada = alternarConformidadLocal(alternarConformidadLocal(enConteo(), NEGRO), NEGRO)
      expect(retirada.confirmaron.negro).toBe(false)
    })

    test('la partida termina cuando ambos están conformes', () => {
      const fin = alternarConformidadLocal(alternarConformidadLocal(enConteo(), BLANCO), NEGRO)
      expect(fin.fase).toBe('terminada')
      expect(fin.resultado).not.toBeNull()
    })

    test('marcar o desmarcar una piedra retira las conformidades', () => {
      const conformeNegro = alternarConformidadLocal(enConteo(), NEGRO)
      const remarcada = marcarMuertaLocal(conformeNegro, 0, 0)
      expect(remarcada.confirmaron).toEqual({ negro: false, blanco: false })
    })

    test('fuera del conteo no hay conformidad que dar', () => {
      expect(() => alternarConformidadLocal(nuevaPartidaLocal(9), NEGRO)).toThrow(JugadaInvalida)
    })
  })

  describe('atari go', () => {
    const atari = () => nuevaPartidaLocal(9, 'atari')

    test('empieza con las cuatro piedras en cruz en el centro y juega negro', () => {
      const p = atari()
      expect(p.modo).toBe('atari')
      expect(p.turno).toBe(NEGRO)
      expect(p.tablero[3][3]).toBe(NEGRO)
      expect(p.tablero[4][4]).toBe(NEGRO)
      expect(p.tablero[3][4]).toBe(BLANCO)
      expect(p.tablero[4][3]).toBe(BLANCO)
      expect(p.tablero.flat().filter((c) => c !== '.')).toHaveLength(4)
    })

    test('no se puede pasar', () => {
      expect(() => pasarLocal(atari())).toThrow(JugadaInvalida)
    })

    test('una jugada sin captura no termina la partida', () => {
      const p = jugarLocal(atari(), 0, 0)
      expect(p.fase).toBe('jugando')
      expect(p.resultado).toBeNull()
    })

    test('la primera captura termina la partida y gana quien la hizo', () => {
      // La blanca de (4,3) ya tiene negras en (3,3) y (4,4): con (5,3) y (4,2) queda sin libertades.
      const p = jugadas(atari(), [5, 3], [0, 0], [4, 2])
      expect(p.fase).toBe('terminada')
      expect(p.capturasNegras).toBe(1)
      expect(p.resultado).toEqual({ negro: 1, blanco: 0, ganador: 'negro' })
      expect(() => jugarLocal(p, 8, 8)).toThrow(JugadaInvalida)
    })

    test('también gana blanco si captura primero', () => {
      // La negra de (3,3) tiene blancas en (3,4) y (4,3): con (2,3) y (3,2) queda sin libertades.
      const p = jugadas(atari(), [0, 0], [2, 3], [8, 8], [3, 2])
      expect(p.fase).toBe('terminada')
      expect(p.resultado?.ganador).toBe('blanco')
    })

    test('en modo partida una captura no termina nada', () => {
      const p = jugadas(nuevaPartidaLocal(9), [0, 1], [0, 0], [1, 0])
      expect(p.capturasNegras).toBe(1)
      expect(p.fase).toBe('jugando')
    })
  })
})
