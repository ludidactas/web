import { expect, test } from './ld-test'
import { MetodosLogin } from '@/wss/validators/auth'

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
    const { sala, idSala, estudiante } = await setupSala({ name: nombreProfe, email: `el.tes.tito.${Date.now()}@fake.com` })

    // La sala abre en la pestaña de Go: vamos a la de encuestas y verificamos que el profe la ve
    await sala.goto(`/salas/${idSala}/encuestas`)
    await expect(sala.getByRole('heading', { name: 'Preguntas', exact: true })).toBeVisible()

    // Acceder como estudiante
    const alumnoPage = await estudiante({ nombre: 'Alumnini Pruebini', dni: '32987654' })

    // Verificar que el estudiante puede ver la sala: entra por la pestaña de Go y tiene la de encuestas a mano
    await expect(alumnoPage.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()
    await expect(alumnoPage.getByRole('link', { name: 'Encuestas' })).toBeVisible()
  })

  test('crear una sala con DNI y acceder con varios', async ({ setupSala, browser }) => {
    const profe = { name: nombreProfe, email: `el.tes.tito.dni.${Date.now()}@fake.com` }
    const { sala, idSala, estudiante } = await setupSala(profe, { metodo_login: MetodosLogin.DNI })

    const companeros = [
      { nombre: 'Alumnini Pruebini', dni: '32987654' },
      { nombre: 'Alumnini Pruebino', dni: '32987655' },
      { nombre: 'Alumnini Pruebina', dni: '32987656' },
    ]
    const paginas = []
    for (const companero of companeros) paginas.push(await estudiante(companero))

    for (const pagina of paginas) {
      await expect(pagina.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()
      await expect(pagina.getByRole('link', { name: 'Encuestas' })).toBeVisible()
    }

    await sala.goto(`/salas/${idSala}/encuestas`)
    for (const { nombre } of companeros) await expect(sala.getByText(nombre, { exact: true })).toBeVisible()

    // Un cuarto estudiante escucha lo que le llega por el websocket desde antes de conectarse
    const recibido: string[] = []
    const espia = await (await browser.newContext()).newPage()
    espia.on('websocket', (ws) => {
      if (ws.url().includes('/_next/')) return
      ws.on('framereceived', ({ payload }) => recibido.push(payload.toString()))
    })
    await espia.goto(`/sala/${idSala}/go/`)
    await espia.getByPlaceholder('Ingresá tu nombre').fill('Alumnini Espiardo')
    await espia.getByPlaceholder('Ingresá tu DNI').fill('32987657')
    await espia.getByRole('button', { name: 'Conectarse' }).click()

    await expect(async () => {
      const refrescar = espia.getByText('Refrescar')
      if (await refrescar.isVisible().catch(() => false)) await refrescar.click()
      await expect(espia.getByText(companeros[0].nombre, { exact: true })).toBeVisible({ timeout: 500 })
    }).toPass({ timeout: 20_000 })

    const frames = recibido.join('\n')
    expect(frames).toContain(companeros[0].nombre)
    for (const { dni } of companeros) expect(frames).not.toContain(dni)
    expect(frames).not.toContain(profe.email)
  })

  test('crear una sala con DNI y lista de permitidos', async ({ setupSala }) => {
    const { sala, idSala, estudiante } = await setupSala(
      { name: nombreProfe, email: `el.tes.tito.lista.${Date.now()}@fake.com` },
      { metodo_login: MetodosLogin.DNI, solo_invitados: true }
    )

    const dniInvitado = '32987654'
    await sala.goto(`/salas/${idSala}/encuestas`)
    await sala.locator('button[title="Configurá el acceso a tu sala"]:visible').click()
    await sala.getByPlaceholder('Ingresar DNI').fill(dniInvitado)
    await sala.getByRole('button', { name: 'Agregar', exact: true }).click()
    await expect(sala.getByText(dniInvitado, { exact: true })).toBeVisible()

    const invitado = await estudiante({ nombre: 'Alumnini Pruebini', dni: dniInvitado })
    await expect(invitado.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()

    const ajeno = await estudiante({ nombre: 'Alumnini Pruebino', dni: '32987655' })
    await expect(ajeno.getByText('no está en la lista de participantes permitidos')).toBeVisible()
    await expect(ajeno.getByRole('heading', { name: 'Partidas', exact: true })).toBeHidden()
  })
})
