import { ConfigCreacionSala, configCreacionSala } from '@/wss/validators/salas'
import { MetodosLogin } from '@/wss/validators/auth'
import { IDENTIDAD_EN_LISTA, OPCIONES_ACCESO, OPCIONES_IDENTIDAD } from '@/components/salas/opciones-sala'
import type { Browser, BrowserContext, Locator, Page } from '@playwright/test'
import { expect, test as base } from '@playwright/test'
import { loginFake } from './auth'

interface LoginUser {
  name: string
  email: string
}

/** Lo que trae cada estudiante: `dni` para salas por DNI y `email` para salas con cuenta de Google. */
interface LoginEstudiante {
  nombre: string
  dni?: string
  email?: string
}

interface LdFixtures {
  login: (user: LoginUser) => Promise<void>
  setupSala: (
    profe: LoginUser,
    config?: ConfigCreacionSala
  ) => Promise<{ sala: Page; idSala: string; estudiante: (estudiante: LoginEstudiante) => Promise<Page> }>
}

/**
 * Las animaciones del sitio corren en `requestAnimationFrame` y, en un Chromium headless sin GPU, cada
 * pestaña consume un núcleo entero. A 4 fps el costo baja ~10x y los callbacks siguen ejecutándose.
 * Se inyecta en cada contexto con `addInitScript`, antes de que corra el código de la página.
 */
const ralentizarAnimaciones = () => {
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(performance.now()), 250)
}

/** Contextos creados con `nuevoContexto` y todavía abiertos; el fixture `cerrarContextos` los vacía tras cada test. */
const contextosAbiertos: BrowserContext[] = []

/**
 * Un contexto de PW para tests: usarlo en vez de `browser.newContext()`. Los de `browser.newContext()` no se
 * cierran al terminar el test (solo al terminar el worker) y siguen consumiendo CPU y conexiones; estos se
 * cierran solos al terminar cada test (fixture `cerrarContextos`).
 */
export async function nuevoContexto(browser: Browser) {
  const context = await browser.newContext()
  contextosAbiertos.push(context)
  await context.addInitScript(ralentizarAnimaciones)
  return context
}

/**
 * Devuelve una nueva `page` de PW con una sesión en el server de NextJS
 * (esto le permite entrar como profe a la sala)
 */
export async function nuevaSesion(browser: Browser, user?: LoginUser) {
  const context = await nuevoContexto(browser)
  const page = await context.newPage()
  if (user) await loginFake(page, user)

  return page
}

/**
 * Crea una sala por la UI como `profe` y devuelve la `page` del profe, el `idSala` y `estudiante()`, que
 * abre un contexto nuevo (otro navegador, otro `clientId`), ingresa a la sala y devuelve su `page`.
 * La lista de `config.listaPermitidos` se carga al crear la sala.
 */
export async function armarSala(browser: Browser, profe: LoginUser, config: ConfigCreacionSala) {
  // Abrimos una tab de profe
  const profeContext = await nuevoContexto(browser)
  const profePage = await profeContext.newPage()

  // Hacemos login como profe de prueba
  await loginFake(profePage, profe)

  // /salas abre el dialog "¿Qué es una sala?" solo, automáticamente, en la primera visita de cada
  // browser context (ver salas-page-client.tsx) — un context de test siempre arranca sin ese flag en
  // localStorage, así que sin esto el dialog tapa "Crear sala" en todo test que arme una sala.
  await profePage.addInitScript(() => localStorage.setItem('salas-saber-mas-visto', '1'))

  // Vamos a la gestión de salas y abrimos el flujo de "Crear sala"
  await profePage.goto('/salas')
  await profePage.getByRole('button', { name: 'Crear sala' }).click()
  await profePage.getByPlaceholder('Ingresa el nombre de la sala').fill(`Sala de prueba ${Date.now()}`)

  if (config.metodo_login) {
    await profePage.getByRole('radio', { name: new RegExp(OPCIONES_IDENTIDAD[config.metodo_login].titulo) }).click()
  }
  if (config.acceso) {
    await profePage.getByRole('radio', { name: new RegExp(OPCIONES_ACCESO[config.acceso].titulo) }).click()
  }

  // La lista de la sala se carga por el formulario de alta, una entrada por vez
  const placeholderIdentidad = IDENTIDAD_EN_LISTA[config.metodo_login ?? MetodosLogin.Nombre].placeholder
  for (const entrada of config.listaPermitidos ?? []) {
    await profePage.getByPlaceholder(placeholderIdentidad).fill(entrada)
    await profePage.getByRole('button', { name: 'Agregar', exact: true }).click()
  }

  await profePage.getByRole('button', { name: 'Crear e ingresar', exact: true }).click()
  // La URL de operación es /salas/<id>/go (default tras crear la sala): el id es el segundo segmento,
  // no el último.
  await profePage.waitForURL(/\/salas\/.+\/go/, { timeout: 20_000 })

  // El link público del estudiante es /sala/<id>/ con el mismo id que la URL de operación
  const idSala = new URL(profePage.url()).pathname.split('/').filter(Boolean)[1]
  if (!idSala) throw new Error('No se pudo obtener el id de la sala')
  const fullUrl = `/sala/${idSala}/`

  // Definimos la función para que un estudiante entre a la sala
  const estudiante = async ({ nombre, dni, email }: LoginEstudiante) => {
    // Abrimos una nueva página como alumno
    const alumnoContext = await nuevoContexto(browser)
    const alumnoPage = await alumnoContext.newPage()

    if (config.metodo_login === MetodosLogin.Google) {
      // Con cuenta de Google, la identidad es la sesión: la abrimos con el provider de test (igual que la del
      // profe) y en la sala confirmamos con esa cuenta. El camino por el IdP lo cubre `idp-login.spec.ts`.
      if (!email) throw new Error('Una sala con cuenta de Google necesita el email del estudiante')
      await loginFake(alumnoPage, { name: nombre, email })
      await alumnoPage.goto(fullUrl)
      await alumnoPage.getByRole('button', { name: 'Ingresar a la sala' }).click()
      return alumnoPage
    }

    // El alumno accede a la sala mediante el link
    await alumnoPage.goto(fullUrl)

    // Llenamos el form de ingreso
    await alumnoPage.getByPlaceholder('Ingresá tu nombre').fill(nombre)
    if (config.metodo_login === MetodosLogin.DNI) {
      if (!dni) throw new Error('Una sala por DNI necesita el DNI del estudiante')
      await alumnoPage.getByPlaceholder('Ingresá tu DNI').fill(dni)
    }
    await alumnoPage.getByRole('button', { name: 'Conectarse' }).click()

    return alumnoPage
  }

  return {
    sala: profePage,
    idSala,
    estudiante,
  }
}

/** Un estudiante entra a la pestaña de Go de una sala de identidad `nombre` y devuelve su `page`. */
export async function entrarGo(browser: Browser, idSala: string, nombre: string): Promise<Page> {
  const context = await nuevoContexto(browser)
  const page = await context.newPage()
  await page.goto(`/sala/${idSala}/go/`)
  await page.getByPlaceholder('Ingresá tu nombre').fill(nombre)
  await page.getByRole('button', { name: 'Conectarse' }).click()
  return page
}

/**
 * Espera a que `buscado` aparezca en la lista de contrincantes. La lista se pide una sola vez al
 * montar, así que mientras esté vacía se pulsa "Refrescar". El `click` tiene un timeout corto y su
 * error se ignora: si la lista llega entre `isVisible` y el click, el botón desaparece y el click
 * no tiene nada que esperar.
 */
export async function esperarEnListaDeContrincantes(page: Page, buscado: Locator) {
  await expect(async () => {
    const refrescar = page.getByText('Refrescar')
    if (await refrescar.isVisible().catch(() => false)) await refrescar.click({ timeout: 1000 }).catch(() => {})
    await expect(buscado).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 20_000 })
}

/** Espera a que un contrincante, por su nombre, aparezca en la lista (ver `esperarEnListaDeContrincantes`). */
export const esperarContrincante = (page: Page, nombre: string) =>
  esperarEnListaDeContrincantes(page, page.getByText(nombre, { exact: true }))

export const test = base.extend<LdFixtures & { cerrarContextos: void }>({
  // Fixture automático: corre en todo test que use este `test`, sin pedirlo.
  cerrarContextos: [
    async ({}, use) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use()
      // Cierra los contextos abiertos durante el test; `.catch` tolera los que el propio test ya cerró.
      await Promise.all(contextosAbiertos.splice(0).map((c) => c.close().catch(() => {})))
    },
    { auto: true },
  ],
  // El contexto que Playwright le da al fixture `page` también corre con las animaciones ralentizadas.
  context: async ({ context }, use) => {
    await context.addInitScript(ralentizarAnimaciones)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(context)
  },
  login: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (user: LoginUser) => {
      await loginFake(page, user)
    })
  },
  setupSala: async ({ browser }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (profe: LoginUser, config?: ConfigCreacionSala) => {
      const conf = configCreacionSala.parse(config ?? {})
      return await armarSala(browser, profe, conf)
    })
  },
})

export { expect }
