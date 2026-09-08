import { Browser, Page, test, expect } from '@playwright/test'
import { configCreacionSala } from '@/wss/validators/salas'
import { armarSala } from './ld-test'

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

const CELDA = 40
const MARGEN = 32
const GLOW_MARGEN = 10

async function escalaDelTablero(page: Page, tamaño: number) {
  const lado = CELDA * (tamaño - 1) + MARGEN * 2 + GLOW_MARGEN * 2
  const box = await page.locator('svg.touch-none').boundingBox()
  if (!box) throw new Error('No se encontró el tablero')
  return box.width / lado
}

async function jugarEn(page: Page, x: number, y: number, tamaño: number) {
  const escala = await escalaDelTablero(page, tamaño)
  await page.locator('svg.touch-none').click({
    position: { x: (MARGEN + x * CELDA + GLOW_MARGEN) * escala, y: (MARGEN + y * CELDA + GLOW_MARGEN) * escala },
  })
}

test('un tercer estudiante puede observar una partida ajena en curso', async ({ browser }) => {
  const profe = { name: 'Profe Go', email: `profe.go.espectador.${Date.now()}@test.com` }
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

  // Carla ve a Ana y Beto "en una partida", con un botón para observar.
  await esperarRival(carla, 'Ana')
  const filaAna = carla.locator('li', { hasText: 'Ana' })
  await expect(filaAna.getByText('En una partida')).toBeVisible()
  await filaAna.getByRole('button', { name: 'Observar' }).click()

  // Ve el tablero (solo lectura) con ambos nombres.
  await expect(carla.locator('svg.touch-none')).toBeVisible()
  await expect(carla.getByText('● Ana')).toBeVisible()
  await expect(carla.getByText('● Beto')).toBeVisible()

  // Ana juega una piedra: Carla ve el broadcast en vivo.
  await jugarEn(negro, 4, 4, 9)
  await expect(carla.getByText('Juega Beto')).toBeVisible()

  // Carla puede dejar de observar y vuelve a la sala.
  await carla.getByRole('button', { name: 'Dejar de observar' }).click()
  await expect(carla.getByText('Elegí un rival')).toBeVisible()
})
