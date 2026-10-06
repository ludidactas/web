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

/** Igual que `esperarContrincante`, pero para la pantalla del profe: ahí el nombre del estudiante
 * también aparece en la lista de participantes (`ListaEstudiantes`), así que en vez de buscar el
 * texto suelto esperamos directo el botón "Invitar" de esa fila, que solo existe en el buscador de
 * contrincantes. */
async function esperarBotonInvitar(page: Page, nombreContrincante: string) {
  const boton = page.locator('li:visible', { hasText: nombreContrincante }).getByRole('button', { name: 'Invitar' })
  await expect(async () => {
    const refrescar = page.getByText('Refrescar')
    if (await refrescar.isVisible().catch(() => false)) await refrescar.click()
    await expect(boton).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 20_000 })
  return boton
}

test('una invitación que llega mientras mirás tu partida ya terminada no te saca de ahí, y te espera sin recargar al volver a la sala', async ({
  browser,
}) => {
  const profe = { name: 'Profe Go', email: `profe.go.reinvitacion.${Date.now()}@test.com` }
  const { sala, idSala } = await armarSala(browser, profe, configCreacionSala.parse({}))

  const pepe = await entrarGo(browser, idSala, 'Pepe')

  // Pepe invita al profe y este acepta: arrancan a jugar.
  await esperarContrincante(pepe, profe.name)
  await pepe.locator('li', { hasText: profe.name }).getByRole('button', { name: 'Invitar' }).click()

  await sala.goto(`/salas/${idSala}/go`)
  await sala.locator('h2:visible', { hasText: '¡Te invitaron a jugar Go!' }).waitFor()
  await sala.locator('button:visible', { hasText: 'Aceptar' }).first().click()
  await expect(pepe.locator('svg.touch-none')).toBeVisible()

  // Pepe abandona sin volver a la sala: se queda mirando la pantalla de resultado ("terminada").
  // "Abandonar" abre un dialog de confirmación — hay que confirmar ahí adentro también.
  await pepe.getByRole('button', { name: 'Abandonar' }).click()
  await pepe.getByRole('dialog').getByRole('button', { name: 'Abandonar' }).click()
  await expect(pepe.getByText('Terminó por abandono')).toBeVisible()

  // El profe (que también era jugador de esa partida) sí vuelve a la sala, para poder invitar de
  // nuevo: eso es esperable, lo que estamos probando es el lado de Pepe, que nunca lo hace.
  await sala.locator('button:visible', { hasText: 'Volver a la sala' }).click()

  // El profe lo invita de nuevo mientras Pepe sigue mirando su tablero terminado.
  const botonInvitar = await esperarBotonInvitar(sala, 'Pepe')
  await botonInvitar.click()

  // Es elección de Pepe dejar de mirar su partida: la invitación no lo saca de ahí solo por haber
  // llegado. Le damos un instante para que, si el bug reapareciera, alcance a auto-redirigirlo.
  await pepe.waitForTimeout(1000)
  await expect(pepe.getByText('Terminó por abandono')).toBeVisible()
  await expect(pepe.getByText('¡Te invitaron a jugar Go!')).not.toBeVisible()

  // Recién cuando Pepe decide volver a la sala por su cuenta ve la invitación — y sin recargar la
  // página: si `partida` seguía apuntando a la ya terminada, antes la perdía hasta el próximo refresh.
  await pepe.getByRole('button', { name: 'Volver a la sala' }).click()
  await expect(pepe.getByText('¡Te invitaron a jugar Go!')).toBeVisible()
})
