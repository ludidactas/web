import { expect, test } from './ld-test'
import { MetodosLogin } from '@/wss/validators/auth'

test.describe('Sala de encuestas', () => {
  test('se puede llegar a la sala desde la portada', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Entrená con profes')).toBeVisible()

    await page.goto('/salas')
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

  test.skip('crear una sala con DNI y acceder con varios', async ({ setupSala }) => {
    const { sala, estudiante } = await setupSala(
      { name: nombreProfe, email: 'el.tes.tito@fake.com' },
      { metodo_login: MetodosLogin.DNI }
    )

    const alumnoPage1 = await estudiante({ nombre: 'Alumnini Pruebini', dni: '32987654' })
    const alumnoPage2 = await estudiante({ nombre: 'Alumnini Pruebino', dni: '32987655' })
    const alumnoPage3 = await estudiante({ nombre: 'Alumnini Pruebina', dni: '32987656' })

    await expect(alumnoPage1.getByText('Sala de Encuestas')).toBeVisible()
    await expect(alumnoPage2.getByText('Sala de Encuestas')).toBeVisible()
    await expect(alumnoPage3.getByText('Sala de Encuestas')).toBeVisible()

    expect(sala.getByText('Alumnini Pruebini')).toBeVisible()
    expect(sala.getByText('Alumnini Pruebino')).toBeVisible()
    expect(sala.getByText('Alumnini Pruebina')).toBeVisible()
  })

  test.skip('crear una sala con DNI y lista de permitidos', async ({ setupSala }) => {
    const { sala, estudiante } = await setupSala(
      { name: nombreProfe, email: 'el.tes.tito@fake.com' },
      { metodo_login: MetodosLogin.DNI, solo_invitados: true }
    )

    const alumnoPage1 = await estudiante({ nombre: 'Alumnini Pruebini', dni: '32987654' })

    await expect(alumnoPage1.getByText('Sala de Encuestas')).toBeVisible()
  })
})
