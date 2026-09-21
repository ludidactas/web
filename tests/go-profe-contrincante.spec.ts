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

async function esperarContrincante(page: Page, nombreContrincante: string) {
  await expect(async () => {
    const refrescar = page.getByText('Refrescar')
    if (await refrescar.isVisible().catch(() => false)) await refrescar.click()
    await expect(page.getByText(nombreContrincante, { exact: true })).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 20_000 })
}

test('el profe aparece como contrincante disponible y se puede jugar contra él', async ({ browser }) => {
  const profe = { name: 'Profe Go', email: `profe.go.contrincante.${Date.now()}@test.com` }
  const { sala, idSala } = await armarSala(browser, profe, configCreacionSala.parse({}))

  const ana = await entrarGo(browser, idSala, 'Ana')

  // El profe ya está conectado a la sala (en /encuestas, tal como lo deja `armarSala`): alcanza con
  // eso para que Ana lo vea disponible, no hace falta que haya entrado a la pestaña de Go todavía.
  await esperarContrincante(ana, profe.name)
  await ana.locator('li', { hasText: profe.name }).getByRole('button', { name: 'Invitar' }).click()

  // El profe entra a Go recién ahora: la invitación ya lo esperaba (persistida en el server, y el
  // store del cliente ya la tenía desde el push en vivo aunque todavía no estuviera en esta pestaña).
  // `GoProfePage` monta dos copias de `GoJuego` a la vez (layout mobile con tabs y desktop, una de las
  // dos oculta por CSS según el viewport), así que apuntamos solo a la visible.
  await sala.goto(`/salas/${idSala}/go`)
  await sala.locator('h2:visible', { hasText: '¡Te invitaron a jugar Go!' }).waitFor()
  await sala.locator('button:visible', { hasText: 'Aceptar' }).click()

  await expect(ana.locator('svg.touch-none')).toBeVisible()
  await expect(sala.locator('svg.touch-none:visible').first()).toBeVisible()
})
