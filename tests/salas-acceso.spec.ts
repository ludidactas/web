import { expect, nuevoContexto, test } from './ld-test'
import type { Page } from '@playwright/test'
import { OPCIONES_ACCESO, OPCIONES_IDENTIDAD } from '@/components/salas/opciones-sala'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'

// Las 9 combinaciones de identidad × acceso. Para cada una se comprueba quién entra y quién no, con un
// estudiante que figura en la lista y otro que no. La lista se carga al crear la sala, por la UI.

/** Un profe nuevo por test: el plan limita las salas por profe, y los tests corren en paralelo. */
const profeNuevo = () => ({ name: 'Profe Acceso', email: `profe.${crypto.randomUUID()}@fake.com` })

/** Un estudiante de cada tipo por identidad: `enLista` figura en la lista de la sala; `afuera`, no. */
const ESTUDIANTES = {
  [MetodosLogin.Nombre]: {
    enLista: { nombre: 'Ana01' },
    afuera: { nombre: 'Intruso01' },
    entrada: 'Ana01',
  },
  [MetodosLogin.DNI]: {
    enLista: { nombre: 'Ana', dni: '30111222' },
    afuera: { nombre: 'Intruso', dni: '30999888' },
    entrada: '30111222',
  },
  [MetodosLogin.Google]: {
    enLista: { nombre: 'Ana', email: 'ana@fake.com' },
    afuera: { nombre: 'Intruso', email: 'intruso@fake.com' },
    entrada: 'ana@fake.com',
  },
}

/** La sala de estudiante se muestra: es la pestaña de Go, a la que se entra por defecto. */
const entro = (page: Page) => expect(page.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()

/** El server lo rechazó: aparece el motivo, se vuelve al ingreso y la sala nunca se muestra. */
async function fueRechazado(page: Page, metodo: MetodosLogin) {
  await expect(page.getByText(/no está en la lista de participantes permitidos/)).toBeVisible()
  const ingreso = metodo === MetodosLogin.Google ? 'Ingresar a la sala' : 'Conectarse'
  await expect(page.getByRole('button', { name: ingreso })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Partidas', exact: true })).toHaveCount(0)
}

/** Se le avisó que figura como invitadx (`sala:invitado`). */
const avisoInvitado = (page: Page) => page.getByText(/Asistencia tomada de/)

for (const metodo of Object.values(MetodosLogin)) {
  const { enLista, afuera, entrada } = ESTUDIANTES[metodo]

  test.describe(`identidad ${OPCIONES_IDENTIDAD[metodo].titulo}`, () => {
    test(`${OPCIONES_ACCESO[AccesoSala.Libre].titulo}: entran todos, estén o no en una lista`, async ({ setupSala }) => {
      const { estudiante } = await setupSala(profeNuevo(), { metodo_login: metodo, acceso: AccesoSala.Libre })

      await entro(await estudiante(enLista))
      await entro(await estudiante(afuera))
    })

    test(`${OPCIONES_ACCESO[AccesoSala.Invitados].titulo}: entran todos y solo a quien figura se le avisa`, async ({
      setupSala,
    }) => {
      const { estudiante } = await setupSala(profeNuevo(), {
        metodo_login: metodo,
        acceso: AccesoSala.Invitados,
        listaPermitidos: [entrada],
      } as never)

      const invitado = await estudiante(enLista)
      await entro(invitado)
      await expect(avisoInvitado(invitado)).toBeVisible()

      const otro = await estudiante(afuera)
      await entro(otro)
      // Ya está adentro y el aviso, de haber llegado, habría llegado con la sala: damos margen a que no llegue.
      await otro.waitForTimeout(1000)
      await expect(avisoInvitado(otro)).toHaveCount(0)
    })

    test(`${OPCIONES_ACCESO[AccesoSala.Lista].titulo}: entra quien figura y se rechaza a quien no`, async ({
      setupSala,
    }) => {
      const { estudiante } = await setupSala(profeNuevo(), {
        metodo_login: metodo,
        acceso: AccesoSala.Lista,
        listaPermitidos: [entrada],
      } as never)

      await entro(await estudiante(enLista))
      await fueRechazado(await estudiante(afuera), metodo)
    })
  })
}

// Lo que pasa con quien ya está adentro, o con la sala misma, cuando el profe cambia algo.
test.describe('cambios del profe con la sala en curso', () => {
  const ingreso = (page: Page) => page.getByRole('button', { name: 'Conectarse' })

  test('lista: quitar a alguien conectado lo devuelve al ingreso, sin ver la sala', async ({ setupSala }) => {
    const { sala, estudiante } = await setupSala(profeNuevo(), {
      metodo_login: MetodosLogin.Nombre,
      acceso: AccesoSala.Lista,
      listaPermitidos: ['Ana01', 'Beto01'],
    } as never)

    const ana = await estudiante({ nombre: 'Ana01' })
    const beto = await estudiante({ nombre: 'Beto01' })
    await entro(ana)
    await entro(beto)

    await sala.getByTitle('Configurá el acceso a tu sala').click()
    await sala.getByRole('button', { name: 'Quitar Ana01' }).click()

    await expect(ingreso(ana)).toBeVisible()
    await expect(ana.getByRole('heading', { name: 'Partidas', exact: true })).toHaveCount(0)
    // Quien sigue en la lista no se entera.
    await expect(beto.getByRole('heading', { name: 'Partidas', exact: true })).toBeVisible()
  })

  test('nombre: un nombre en uso se rechaza hasta que el profe lo libera', async ({ setupSala }) => {
    const { sala, estudiante } = await setupSala(profeNuevo(), {
      metodo_login: MetodosLogin.Nombre,
      acceso: AccesoSala.Libre,
    })

    const original = await estudiante({ nombre: 'Ana01' })
    await entro(original)

    const otroDispositivo = await estudiante({ nombre: 'Ana01' })
    await expect(otroDispositivo.getByText(/ya está en uso/)).toBeVisible()
    await expect(ingreso(otroDispositivo)).toBeVisible()

    await sala.getByRole('button', { name: 'Liberar el nombre Ana01' }).click()
    await sala.getByRole('button', { name: 'Liberar nombre', exact: true }).click()

    // Quien lo tenía queda afuera y el otro dispositivo, que reintenta, lo reclama.
    await expect(ingreso(original)).toBeVisible()
    await otroDispositivo.getByRole('button', { name: 'Conectarse' }).click()
    await entro(otroDispositivo)
  })

  test('una sala eliminada deja de existir para quien abre su link', async ({ browser, setupSala }) => {
    const { sala, idSala } = await setupSala(profeNuevo(), { metodo_login: MetodosLogin.Nombre })

    await sala.goto('/salas')
    await sala.locator('button:has(svg[class*="lucide-trash"])').click()
    await sala.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(sala.getByText('No tenés ninguna sala creada todavía.')).toBeVisible()

    const page = await (await nuevoContexto(browser)).newPage()
    await page.goto(`/sala/${idSala}/`)
    await expect(page.getByText(/Esta sala no existe/)).toBeVisible()
  })
})
