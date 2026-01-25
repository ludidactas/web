import { expect, test } from './ld-test'

test.describe('Test prueba', () => {
  test('landing luce bien', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Entrená con profes')).toBeVisible()

    await page.goto('/sala')
    await expect(page.getByText('Conectate con tu cuenta de Google')).toBeVisible()
  })

  const nombreProfe = 'Eltes Tito'
  test.only('loguearse como profe y acceder a la sala', async ({ browser, page, login }) => {
    // Hacemos login como profe de prueba
    await login({ name: nombreProfe, email: 'el.tes.tito@fake.com' })

    // Vamos a la sala
    await page.goto('/sala')
    await expect(page.getByRole('heading', { name: '¡Haz una pregunta!' })).toBeVisible()

    // Capturamos el link de la sala
    const linkSala = page.locator('p').filter({ hasText: 'Tu sala:' }).locator('a').first()
    const fullUrl = await linkSala.getAttribute('href')
    await expect(fullUrl).toBeDefined()

    // Abrimos una nueva página como alumno
    const alumnoContext = await browser.newContext()
    const alumnoPage = await alumnoContext.newPage()

    // El alumno accede a la sala mediante el link
    await alumnoPage.goto(fullUrl!)

    // Debería verse la antesala con el nombre del profe
    await expect(alumnoPage.getByText(nombreProfe)).toBeVisible()

    // Hacemos un logincito
    await alumnoPage.getByPlaceholder('Ingresá tu nombre').fill('Alumnini Pruebini')
    await alumnoPage.getByPlaceholder('Ingresá tu DNI').fill('32987654')
    await alumnoPage.getByRole('button', { name: 'Conectarse' }).click()

    // Debería verse el label de 'Sala de Encuestas'
    await expect(alumnoPage.getByText('Sala de Encuestas')).toBeVisible()
  })
})
