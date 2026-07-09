import { ConfigCreacionSala, configCreacionSala, ConfigSala } from '@/wss/validators/salas'
import { MetodosLogin } from '@/wss/validators/auth'
import type { Browser, Page } from '@playwright/test'
import { test as base } from '@playwright/test'
import { loginFake } from './auth'

interface LoginUser {
  name: string
  email: string
}

interface LoginEstudiante {
  nombre: string
  dni: string
}

interface LdFixtures {
  login: (user: LoginUser) => Promise<void>
  setupSala: (
    profe: LoginUser,
    config?: ConfigCreacionSala
  ) => Promise<{ sala: Page; estudiante: (estudiante: LoginEstudiante) => Promise<Page> }>
}

/**
 * Devuelve una nueva `page` de PW con una sesión en el server de NextJS
 * (esto le permite entrar como profe a la sala)
 */
export async function nuevaSesion(browser: Browser, user?: LoginUser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  if (user) await loginFake(page, user)

  return page
}

/**
 * Crea una sala nueva con la configuración dada, y devuelve la `page` de esa sala, y una función para ingesar estudiantes a esa sala.
 * @param browser instancia de `Browser` de PW, que se asume ya está inicializada en el test
 * @param profe autenticación del profe que va a crear la sala
 * @param config configuración de la sala a crear. Si no se provee, se asume la configuración por defecto (sin DNI ni lista de permitidos)
 * @returns un objeto con la `page` de la sala creada, y una función para que un estudiante entre a esa sala (recibe el nombre y DNI del estudiante, y devuelve la `page` del estudiante ya dentro de la sala)
 */
export async function armarSala(browser: Browser, profe: LoginUser, config: ConfigCreacionSala) {
  // Abrimos una tab de profe
  const profeContext = await browser.newContext()
  const profePage = await profeContext.newPage()

  // Hacemos login como profe de prueba
  await loginFake(profePage, profe)

  // Vamos a la sala y agarramos el link
  await profePage.goto('/salas')

  /**
   * @todo: Acá configurar la sala en vez de asumir que de una entramos
   */

  const linkSala = profePage.locator('p').filter({ hasText: 'Tu sala:' }).locator('a').first()
  const fullUrl = await linkSala.getAttribute('href')

  if (!fullUrl) throw new Error('No se pudo obtener el link de la sala')

  // Definimos la función para que un estudiante entre a la sala
  const estudiante = async ({ nombre, dni }: LoginEstudiante) => {
    // Abrimos una nueva página como alumno
    const alumnoContext = await browser.newContext()
    const alumnoPage = await alumnoContext.newPage()

    // El alumno accede a la sala mediante el link
    await alumnoPage.goto(fullUrl)

    // Llenamos el form de ingreso
    await alumnoPage.getByPlaceholder('Ingresá tu nombre').fill(nombre)
    if (config.metodo_login === MetodosLogin.DNI) await alumnoPage.getByPlaceholder('Ingresá tu DNI').fill(dni)
    await alumnoPage.getByRole('button', { name: 'Conectarse' }).click()

    return alumnoPage
  }

  return {
    sala: profePage,
    estudiante,
  }
}

export const test = base.extend<LdFixtures>({
  login: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (user: LoginUser) => {
      await loginFake(page, user)
    })
  },
  setupSala: async ({ browser }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (profe: LoginUser, config?: ConfigSala) => {
      const conf = configCreacionSala.parse(config ?? {})
      return await armarSala(browser, profe, conf)
    })
  },
})

export { expect } from '@playwright/test'
