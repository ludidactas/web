import { Browser, Page, test, expect } from '@playwright/test'
import { configCreacionSala } from '@/wss/validators/salas'
import { armarSala } from './ld-test'

/**
 * Arma, entre dos estudiantes y con un tercero observando, una partida de 9x9 "casi completa": cuatro
 * esquinas con grupos incondicionalmente vivos (dos negros, dos blancos, cada uno con sus dos ojos) y
 * cuatro cadenitas sueltas sin ojos (dos negras, dos blancas) que Benson no reconoce como vivas.
 * Verifica que durante el conteo el hover distingue cadenas vivas de muertas, y sigue hasta marcar las
 * muertas, confirmar y llegar al resultado final — el estado que más cuesta reproducir a mano.
 *
 * La secuencia de jugadas está verificada con el motor real: 32 jugadas, cero capturas, exactamente
 * los grupos vivos/muertos esperados y un puntaje final determinístico (Negro 4 — Blanco 9.5, gana
 * blanco por el komi de 9x9).
 */

const TAMAÑO = 9
const CELDA = 40
const MARGEN = 32
const GLOW_MARGEN = 10
const LADO = CELDA * (TAMAÑO - 1) + MARGEN * 2
const VIEWBOX_LADO = LADO + GLOW_MARGEN * 2

// Esquina superior izquierda (negro) y esquina inferior derecha (blanco): pared conectada de 6
// piedras encerrando 2 ojos de un punto cada una. Esquina superior derecha (negro) e inferior
// izquierda (blanco): la misma forma, rotada/reflejada a la otra diagonal.
const NEGRO_MOVES: Array<[number, number]> = [
  [1, 0],
  [3, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1], // esquina sup-izq completa (ojos en (0,0) y (2,0))
  [7, 0],
  [7, 1],
  [7, 2],
  [7, 3],
  [8, 1],
  [8, 3], // esquina sup-der completa (ojos en (8,0) y (8,2))
  [4, 2],
  [4, 3], // cadenita muerta A (2 piedras, sin ojos)
  [6, 4],
  [6, 5], // cadenita muerta B (2 piedras, sin ojos)
]

const BLANCO_MOVES: Array<[number, number]> = [
  [1, 8],
  [3, 8],
  [0, 7],
  [1, 7],
  [2, 7],
  [3, 7], // esquina inf-izq completa (ojos en (0,8) y (2,8))
  [7, 8],
  [5, 8],
  [8, 7],
  [7, 7],
  [6, 7],
  [5, 7], // esquina inf-der completa (ojos en (8,8) y (6,8))
  [2, 4],
  [2, 5], // cadenita muerta C (2 piedras, sin ojos)
  [4, 5],
  [4, 6], // cadenita muerta D (2 piedras, sin ojos)
]

async function entrarGo(browser: Browser, idSala: string, nombre: string): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/sala/${idSala}/go/`)
  await page.getByPlaceholder('Ingresá tu nombre').fill(nombre)
  await page.getByRole('button', { name: 'Conectarse' }).click()
  return page
}

async function esperarRival(page: Page, nombreRival: string) {
  await expect(async () => {
    const refrescar = page.getByText('Refrescar')
    if (await refrescar.isVisible().catch(() => false)) await refrescar.click()
    await expect(page.getByText(nombreRival, { exact: true })).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 20_000 })
}

function posicionEnTablero(x: number, y: number, escala: number) {
  // El viewBox arranca en `-GLOW_MARGEN`, así que el punto (0,0) del contenido real no coincide con
  // la esquina del elemento renderizado: hay que sumarle ese offset de vuelta (ver puntoDesdeEvento
  // en tablero-go.tsx, esto es su inversa).
  return {
    x: (MARGEN + x * CELDA + GLOW_MARGEN) * escala,
    y: (MARGEN + y * CELDA + GLOW_MARGEN) * escala,
  }
}

async function escalaDelTablero(page: Page) {
  const box = await page.locator('svg.touch-none').boundingBox()
  if (!box) throw new Error('No se encontró el tablero')
  return box.width / VIEWBOX_LADO
}

/** Clickea una posición del tablero: juega una piedra (fase "jugando") o marca/desmarca un grupo
 * muerto (fase "contando") — cuál de las dos depende del estado actual de la partida. */
async function clickearEn(page: Page, x: number, y: number) {
  const escala = await escalaDelTablero(page)
  await page.locator('svg.touch-none').click({ position: posicionEnTablero(x, y, escala) })
}

async function hoverEn(page: Page, x: number, y: number) {
  const escala = await escalaDelTablero(page)
  await page.locator('svg.touch-none').hover({ position: posicionEnTablero(x, y, escala) })
}

/** Resalte (outline) que dibuja `TableroGo` sobre el grupo bajo el cursor durante el conteo. */
function resalteDeHover(page: Page) {
  return page.locator('svg.touch-none g[filter]')
}

/** Juega en `actor` y espera que `oponente` reciba el broadcast (su turno) antes de seguir. */
async function jugarYEsperarTurno(actor: Page, oponente: Page, x: number, y: number) {
  await clickearEn(actor, x, y)
  await expect(oponente.getByText('tu turno')).toBeVisible()
}

test('partida de 9x9 casi completa: tres personas conectadas, cadenas vivas y muertas, hasta el resultado final', async ({
  browser,
}) => {
  test.setTimeout(90_000)

  const profe = { name: 'Profe Go', email: `profe.go.${Date.now()}@test.com` }
  const { idSala } = await armarSala(browser, profe, configCreacionSala.parse({}))

  const negro = await entrarGo(browser, idSala, 'Ana')
  const blanco = await entrarGo(browser, idSala, 'Beto')
  const carla = await entrarGo(browser, idSala, 'Carla')

  await esperarRival(negro, 'Beto')
  await negro.locator('li', { hasText: 'Beto' }).getByRole('button', { name: 'Desafiar' }).click()

  await blanco.getByText('¡Te desafiaron a Go!').waitFor()
  await blanco.getByRole('button', { name: 'Aceptar' }).click()

  await expect(negro.locator('svg.touch-none')).toBeVisible()
  await expect(blanco.locator('svg.touch-none')).toBeVisible()

  // Carla entra como espectadora antes de que empiecen a jugar, y se queda mirando toda la partida.
  await esperarRival(carla, 'Ana')
  const filaAna = carla.locator('li', { hasText: 'Ana' })
  await expect(filaAna.getByText('En una partida')).toBeVisible()
  await filaAna.getByRole('button', { name: 'Observar' }).click()
  await expect(carla.locator('svg.touch-none')).toBeVisible()

  // Las cuatro esquinas (dos negras, dos blancas) y las cuatro cadenitas sueltas, alternando turno.
  for (let i = 0; i < NEGRO_MOVES.length; i++) {
    await jugarYEsperarTurno(negro, blanco, ...NEGRO_MOVES[i])
    await jugarYEsperarTurno(blanco, negro, ...BLANCO_MOVES[i])
  }

  // Carla recibe el estado en vivo: le toca jugar a Ana a continuación de la última jugada de Beto.
  await expect(carla.getByText('Juega Ana')).toBeVisible()

  await expect(negro.getByText('tu turno')).toBeVisible()
  await negro.getByRole('button', { name: 'Pasar' }).click()
  await expect(blanco.getByText('tu turno')).toBeVisible()
  await blanco.getByRole('button', { name: 'Pasar' }).click()

  await expect(negro.getByText('Marcá las piedras muertas y confirmá.')).toBeVisible()
  await expect(blanco.getByText('Marcá las piedras muertas y confirmá.')).toBeVisible()
  await expect(carla.getByText('Contando piedras muertas…')).toBeVisible()

  // Esquina viva (negra, sup-izq): no es seleccionable durante el conteo, el hover no la resalta.
  await hoverEn(negro, 1, 0)
  await expect(resalteDeHover(negro)).toHaveCount(0)

  // Esquina viva (blanca, inf-izq): tampoco.
  await hoverEn(negro, 0, 7)
  await expect(resalteDeHover(negro)).toHaveCount(0)

  // Cadenita muerta negra A: el hover sobre cualquiera de sus 2 piedras resalta las 2.
  await hoverEn(negro, 4, 2)
  await expect(resalteDeHover(negro).locator('circle')).toHaveCount(2)

  // Cadenita muerta blanca C: mismo resalte, sobre su propio grupo.
  await hoverEn(negro, 2, 4)
  await expect(resalteDeHover(negro).locator('circle')).toHaveCount(2)

  // Marcamos las cuatro cadenitas muertas (alcanza un click por grupo: marca todo el grupo conectado).
  await clickearEn(negro, 4, 2)
  await clickearEn(negro, 6, 4)
  await clickearEn(negro, 2, 4)
  await clickearEn(negro, 4, 5)

  // Este estado (fase de conteo con cadenas vivas/inciertas ya en el tablero, y un tercero
  // observando) es muy difícil de reproducir a mano; para inspeccionar la UI acá, habilitar
  // temporalmente `await negro.pause()`.
  await negro.pause()

  await negro.getByRole('button', { name: 'Confirmar conteo' }).click()
  await blanco.getByRole('button', { name: 'Confirmar conteo' }).click()

  // Con las 4 cadenitas removidas, el único territorio son los 4 ojos de cada color: Negro 4, y
  // Blanco 4 + el komi de 9x9 (5.5) = 9.5 — verificado de antemano corriendo el motor real.
  for (const page of [negro, blanco, carla]) {
    await expect(page.getByRole('heading', { name: 'Ganó Blanco' })).toBeVisible()
    await expect(page.getByText('Negro 4 — Blanco 9.5')).toBeVisible()
  }
})
