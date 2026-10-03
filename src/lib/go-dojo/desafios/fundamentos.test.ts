import { describe, expect, test } from 'bun:test'
import { getDesafiosFundamentos } from '.'
import { BLANCO, NEGRO, calcularTerritorio, rival } from '@/lib/go/motor'
import { parsearDesafios } from './cargador'
import { aplicarJugada, estaOcupado, evaluarJugada, retirarGrupo, tableroDesdePiedras } from '../motor-desafio'
import type { Desafio, NodoSecuencia, Piedra, Punto } from '../tipos'

// Los desafíos se bajan del repo público (`REPO_DESAFIOS_OGS`): estos tests necesitan red.
const desafios = await getDesafiosFundamentos()
const porId = (id: string) => desafios.find((d) => d.id === `fundamentos-${id}`)!

/** Recorre todos los caminos del árbol de una secuencia aplicando jugada del estudiante + respuesta del rival. */
function recorrer(d: Desafio, nodo: NodoSecuencia, piedras: Piedra[], capturasPrevias: number, visita: (hoja: { correcto: boolean; capturas: number }) => void) {
  for (const rama of nodo.ramas) {
    expect(estaOcupado(piedras, rama.en[0], rama.en[1])).toBe(false)
    const tras = aplicarJugada(piedras, rama.en[0], rama.en[1], d.turno, d.tamañoTablero)
    let tablero = tras.piedras
    let capturas = capturasPrevias + tras.capturadas.size
    if (rama.respuestaRival && (rama.siguiente || !rama.correcto)) {
      const [rr, rc] = rama.respuestaRival
      expect(estaOcupado(tablero, rr, rc)).toBe(false)
      tablero = aplicarJugada(tablero, rr, rc, rival(d.turno), d.tamañoTablero).piedras
    }
    if (rama.siguiente) {
      recorrer(d, rama.siguiente, tablero, capturas, visita)
    } else {
      visita({ correcto: rama.correcto, capturas })
    }
  }
}

test('la colección parsea y tiene ids únicos', () => {
  expect(desafios.length).toBe(36)
})

test('las piedras iniciales no se pisan ni salen del tablero', () => {
  for (const d of desafios) {
    const vistos = new Set<string>()
    for (const p of d.piedras) {
      expect(p.r).toBeLessThan(d.tamañoTablero)
      expect(p.c).toBeLessThan(d.tamañoTablero)
      const k = `${p.r},${p.c}`
      expect(vistos.has(k)).toBe(false)
      vistos.add(k)
    }
  }
})

describe('tipo "jugada"', () => {
  const jugadas = desafios.filter((d) => d.tipo === 'jugada')

  test.each(jugadas.map((d) => [d.id, d] as const))('%s: todas las jugadas correctas son legibles y caen en puntos libres', (_id, d) => {
    for (const [r, c] of d.jugadasCorrectas!) {
      expect(r).toBeLessThan(d.tamañoTablero)
      expect(c).toBeLessThan(d.tamañoTablero)
      expect(evaluarJugada(d, r, c)?.esCorrecta).toBe(true)
    }
  })

  // En los problemas de captura la jugada correcta es la única que captura: si las coordenadas
  // estuvieran transpuestas o espejadas, o no capturaría nada o capturaría en otro punto.
  const captura = ['capturar-una-piedra', 'atari', 'autocaptura-1', 'autocaptura-2', 'autocaptura-3', 'que-es-un-ojo', 'regla-del-ko']
  test.each(captura)('%s: solo la jugada correcta captura', (id) => {
    const d = porId(id)
    const correctas = new Set(d.jugadasCorrectas!.map(([r, c]) => `${r},${c}`))
    for (let r = 0; r < d.tamañoTablero; r++) {
      for (let c = 0; c < d.tamañoTablero; c++) {
        const res = evaluarJugada(d, r, c)
        if (!res) continue
        expect(res.capturadas.size > 0).toBe(correctas.has(`${r},${c}`))
      }
    }
  })

  test('capturar-una-piedra captura exactamente la piedra negra', () => {
    const d = porId('capturar-una-piedra')
    const [r, c] = d.jugadasCorrectas![0]
    expect(evaluarJugada(d, r, c)!.capturadas.size).toBe(1)
  })

  test('atari captura la cadena de 3 piedras', () => {
    const d = porId('atari')
    const [r, c] = d.jugadasCorrectas![0]
    expect(evaluarJugada(d, r, c)!.capturadas.size).toBe(3)
  })

  test('las lecciones de tablero aceptan solo la zona pedida', () => {
    const esquina = porId('esquinas-lados-centro')
    expect(evaluarJugada(esquina, 0, 8)?.esCorrecta).toBe(true)
    expect(evaluarJugada(esquina, 8, 0)?.esCorrecta).toBe(false)
    const lado = porId('tamanos-de-tablero')
    expect(lado.tamañoTablero).toBe(13)
    expect(evaluarJugada(lado, 6, 12)?.esCorrecta).toBe(true)
    expect(evaluarJugada(lado, 0, 12)?.esCorrecta).toBe(false)
    const estrella = porId('puntos-estrella')
    expect(evaluarJugada(estrella, 3, 3)?.esCorrecta).toBe(true)
    expect(evaluarJugada(estrella, 3, 4)?.esCorrecta).toBe(false)
  })
})

describe('tipo "secuencia"', () => {
  const secuencias = desafios.filter((d) => d.tipo === 'secuencia')

  test.each(secuencias.map((d) => [d.id, d] as const))('%s: todas las jugadas del árbol son legales y hay un final correcto', (_id, d) => {
    const hojas: { correcto: boolean; capturas: number }[] = []
    recorrer(d, d.secuencia!, d.piedras, 0, (h) => hojas.push(h))
    expect(hojas.some((h) => h.correcto)).toBe(true)
  })

  test('las ramas correctas capturan lo que dice la explicación', () => {
    const capturasDe = (id: string) => {
      const d = porId(id)
      const hojas: { correcto: boolean; capturas: number }[] = []
      recorrer(d, d.secuencia!, d.piedras, 0, (h) => hojas.push(h))
      return hojas.filter((h) => h.correcto).map((h) => h.capturas)
    }
    // Ojo de dos puntos: la piedra de Negro cae, y la segunda jugada captura las 4 blancas del grupo.
    expect(capturasDe('ojo-de-dos-puntos').every((n) => n >= 4)).toBe(true)
    expect(capturasDe('uno-o-dos-ojos').every((n) => n >= 1)).toBe(true)
    expect(capturasDe('ojo-falso').every((n) => n >= 1)).toBe(true)
  })

  test('las ramas incorrectas con refutación guardan la respuesta del rival', () => {
    const { ramas } = porId('uno-o-dos-ojos').secuencia!
    for (const r of ramas.filter((r) => !r.correcto)) {
      expect(r.siguiente).toBeUndefined()
      expect(r.respuestaRival).toEqual([1, 8])
    }
  })

  test('uno-o-dos-ojos: los extremos del ojo son incorrectos y el centro es correcto', () => {
    const { ramas } = porId('uno-o-dos-ojos').secuencia!
    expect(ramas.find((r) => r.en[0] === 1 && r.en[1] === 8)!.correcto).toBe(true)
    expect(ramas.filter((r) => !r.correcto).map((r) => r.en as Punto)).toEqual([[2, 8], [0, 8]])
  })
})

describe('tipo "opciones"', () => {
  const quizzes = desafios.filter((d) => d.tipo === 'opciones' && d.etiqueta === 'territorio')
  // Piedras muertas por desafío: se retiran antes de contar y valen un punto más como prisioneras.
  const muertas: Record<string, [number, number][]> = {
    'fundamentos-territorio-muertas-1': [[6, 7]],
    'fundamentos-territorio-muertas-2': [[7, 4], [7, 5]],
  }

  test('hay 12 preguntas de territorio y cada una tiene exactamente una opción correcta', () => {
    expect(quizzes.length).toBe(12)
    for (const d of quizzes) expect(d.opciones!.filter((o) => o.correcta).length).toBe(1)
  })

  // La zona cerrada es la región de territorio más chica del tablero; la otra es el espacio abierto.
  test.each(quizzes.map((d) => [d.id, d] as const))('%s: la opción correcta es el territorio que calcula el motor', (id, d) => {
    const removidas = Array.from({ length: d.tamañoTablero }, () => Array(d.tamañoTablero).fill(false))
    for (const [r, c] of muertas[id] ?? []) removidas[r][c] = true
    const territorio = calcularTerritorio(tableroDesdePiedras(d.piedras, d.tamañoTablero), removidas, d.tamañoTablero)
    const cuenta = { [NEGRO]: 0, [BLANCO]: 0 } as Record<string, number>
    for (const fila of territorio) for (const v of fila) if (v === NEGRO || v === BLANCO) cuenta[v]++
    const esperado = Math.min(cuenta[NEGRO], cuenta[BLANCO]) + (muertas[id]?.length ?? 0)
    expect(Number(d.opciones!.find((o) => o.correcta)!.texto)).toBe(esperado)
  })

  test('los botones de Pasar y Terminar tienen una única opción correcta', () => {
    for (const id of ['pasar', 'contar-puntos']) {
      const d = porId(id)
      expect(d.opciones!.length).toBe(1)
      expect(d.opciones![0].correcta).toBe(true)
    }
  })

  test('contar-puntos: tras retirar las piedras muertas Negro tiene 24 puntos de territorio y Blanco 18', () => {
    const d = porId('contar-puntos')
    const removidas = Array.from({ length: 9 }, () => Array(9).fill(false))
    const territorio = calcularTerritorio(tableroDesdePiedras(d.piedras, 9), removidas, 9)
    const total = (color: string) => territorio.flat().filter((v) => v === color).length
    expect(total(NEGRO)).toBe(24)
    expect(total(BLANCO)).toBe(18)
  })
})

describe('tipo "retirar"', () => {
  const d = porId('retirar-muertas')

  test('tocar un punto de un grupo muerto retira el grupo entero (4 piedras) y resuelve el desafío', () => {
    const [r, c] = d.piedrasMuertas![0]
    const res = retirarGrupo(d, d.piedras, r, c)!
    expect(res.muerta).toBe(true)
    expect(res.completo).toBe(true)
    expect(d.piedras.length - res.piedras.length).toBe(4)
  })

  test('cualquier piedra del mismo grupo cuenta, no solo la listada', () => {
    const res = retirarGrupo(d, d.piedras, 1, 7)!
    expect(res.muerta).toBe(true)
    expect(res.completo).toBe(true)
  })

  test('tocar una piedra viva no retira nada', () => {
    const viva = d.piedras.find((p) => p.color === 'B')!
    const res = retirarGrupo(d, d.piedras, viva.r, viva.c)!
    expect(res.muerta).toBe(false)
    expect(res.piedras).toBe(d.piedras)
  })

  test('un punto vacío no es un toque válido', () => {
    expect(retirarGrupo(d, d.piedras, 8, 8)).toBeNull()
  })

  test('con dos grupos muertos, el desafío se completa recién al retirar el segundo', () => {
    const dos = { ...d, piedras: [{ r: 0, c: 0, color: 'N' as const }, { r: 8, c: 8, color: 'N' as const }], piedrasMuertas: [[0, 0], [8, 8]] as [number, number][] }
    const primero = retirarGrupo(dos, dos.piedras, 0, 0)!
    expect(primero.completo).toBe(false)
    expect(retirarGrupo(dos, primero.piedras, 8, 8)!.completo).toBe(true)
  })
})

describe('validación del schema para los tipos nuevos', () => {
  const base = `- id: x\n  titulo: x\n  piedras:\n    - { r: 0, c: 0, color: N }\n`

  test('opciones sin ninguna correcta es inválido', () => {
    const yaml = `${base}  tipo: opciones\n  opciones:\n    - { texto: "1", correcta: false }\n`
    expect(() => parsearDesafios(yaml)).toThrow(/correcta/)
  })

  test('opciones sin el campo opciones es inválido', () => {
    expect(() => parsearDesafios(`${base}  tipo: opciones\n`)).toThrow(/opciones/)
  })

  test('retirar sin piedrasMuertas es inválido', () => {
    expect(() => parsearDesafios(`${base}  tipo: retirar\n`)).toThrow(/piedrasMuertas/)
  })

  test('retirar apuntando a un punto sin piedra es inválido', () => {
    expect(() => parsearDesafios(`${base}  tipo: retirar\n  piedrasMuertas:\n    - [3, 3]\n`)).toThrow(/no hay ninguna piedra/)
  })

  test('opciones y retirar válidos no necesitan jugadasCorrectas ni explicacion', () => {
    expect(parsearDesafios(`${base}  tipo: opciones\n  opciones:\n    - { texto: Ok, correcta: true }\n`).length).toBe(1)
    expect(parsearDesafios(`${base}  tipo: retirar\n  piedrasMuertas:\n    - [0, 0]\n`).length).toBe(1)
  })
})
