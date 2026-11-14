import { expect, test } from './ld-test'

test.describe('Sala de encuestas', () => {
  test('se puede llegar a la sala desde la portada', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Taller lúdico')).toBeVisible()

    await page.goto('/salas')
    await expect(page.getByText('Conectate con tu cuenta de Google')).toBeVisible()
  })

  const nombreProfe = 'Eltes Tito'

  test('loguearse como profe y acceder a la sala como estudiante', async ({ setupSala }) => {
    // Armar la sala como profe
    const { sala, idSala, estudiante } = await setupSala({ name: nombreProfe, email: 'el.tes.tito@fake.com' })

    // La sala abre en la pestaña de Go: vamos a la de encuestas y verificamos que el profe la ve
    await sala.goto(`/salas/${idSala}/encuestas`)
    await expect(sala.getByRole('heading', { name: 'Preguntas', exact: true })).toBeVisible()

    // Acceder como estudiante
    const alumnoPage = await estudiante({ nombre: 'Alumnini Pruebini', dni: '32987654' })

    // Verificar que el estudiante puede ver la sala: entra por la pestaña de Go y tiene la de encuestas a mano
    await expect(alumnoPage.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()
    await expect(alumnoPage.getByRole('link', { name: 'Encuestas' })).toBeVisible()
  })
})
