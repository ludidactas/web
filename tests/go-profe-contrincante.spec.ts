import { configCreacionSala } from '@/wss/validators/salas'
import { armarSala, entrarGo, esperarContrincante, expect, test } from './ld-test'

test('el profe aparece como contrincante disponible y se puede jugar contra él', async ({ browser }) => {
  const profe = { name: 'Profe Go', email: `profe.go.contrincante.${Date.now()}@test.com` }
  const { sala, idSala } = await armarSala(browser, profe, configCreacionSala.parse({}))

  const ana = await entrarGo(browser, idSala, 'Ana')

  // El profe ya está conectado a la sala (tal como lo deja `armarSala`): alcanza con eso para que Ana
  // lo vea disponible, no hace falta que haya entrado a la pestaña de Go todavía.
  await esperarContrincante(ana, profe.name)
  await ana.locator('li', { hasText: profe.name }).getByRole('button', { name: 'Invitar' }).click()
  await ana.getByRole('button', { name: /^Partida/ }).click()

  // El profe entra a Go recién ahora: la invitación ya lo esperaba (persistida en el server, y el
  // store del cliente ya la tenía desde el push en vivo aunque todavía no estuviera en esta pestaña).
  // `GoProfePage` monta dos copias de `GoJuego` a la vez (layout mobile con tabs y desktop, una de las
  // dos oculta por CSS según el viewport), así que apuntamos solo a la visible.
  await sala.goto(`/salas/${idSala}/go`)
  await sala.locator('h2:visible', { hasText: '¡Te invitaron a jugar Go!' }).waitFor()
  // El botón "Aceptar" aparece dos veces (la tarjeta de invitación y la fila del contrincante en la
  // lista, que ofrece el mismo atajo): cualquiera de los dos acepta la misma invitación.
  await sala.locator('button:visible', { hasText: 'Aceptar' }).first().click()

  await expect(ana.locator('svg.touch-none')).toBeVisible()
  await expect(sala.locator('svg.touch-none:visible').first()).toBeVisible()
})
