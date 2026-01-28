import { expect, test } from './ld-test'

test.describe('Test prueba', () => {
  test('landing luce bien', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Entrená con profes')).toBeVisible()

    await page.goto('/sala')
    await expect(page.getByText('Conectate con tu cuenta de Google')).toBeVisible()
  })

  const nombreProfe = 'Eltes Tito'

  test('loguearse como profe y acceder a la sala como estudiante', async ({ setupSala }) => {
    // Armar la sala como profe
    const { sala, estudiante } = await setupSala({ name: nombreProfe, email: 'el.tes.tito@fake.com' })

    // Verificar que el profe puede ver la sala
    await expect(sala.getByRole('heading', { name: '¡Haz una pregunta!' })).toBeVisible()

    // Acceder como estudiante
    const alumnoPage = await estudiante({ nombre: 'Alumnini Pruebini', dni: '32987654' })

    // Verificar que el estudiante puede ver la sala
    await expect(alumnoPage.getByText('Sala de Encuestas')).toBeVisible()
  })

  test.skip('crear una encuesta y responderla', async ({ setupSala }) => {})

  test.skip('desloguearse y re-loguearse como profe y ver que todo siga normal', async ({ setupSala }) => {})

  test.skip('desloguearse y re-loguearse como estudiante y ver que todo siga normal', async ({ setupSala }) => {})
})
