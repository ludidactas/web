import { expect, test } from './ld-test'
import type { Page } from '@playwright/test'
import { OPCIONES_ACCESO, OPCIONES_IDENTIDAD } from '@/components/salas/opciones-sala'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'

// Las 9 combinaciones de identidad × acceso. Para cada una se comprueba quién entra y quién no, con un
// estudiante que figura en la lista y otro que no. La lista se carga al crear la sala, por la UI.

/** Un profe nuevo por test: el plan limita las salas por profe, y los tests corren en paralelo. */
const profeNuevo = () => ({ name: 'Profe Acceso', email: `profe.${crypto.randomUUID()}@fake.com` })

// Cada test arma una sala y entra con dos estudiantes.
test.describe.configure({ timeout: 60_000 })

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
