import type { Browser } from "@playwright/test"
import { test as base } from "@playwright/test"
import { loginFake } from "./auth"

interface LoginUser { 
  name: string
  email: string
}

interface LdFixtures { 
  login: (user: LoginUser) => Promise<void>
}


/** 
 * Devuelve una nueva `page` de PW con una sesión en el server de NextJS 
 * (esto le permite entrar como profe a la sala) 
 */
export async function nuevaSesion(browser: Browser, user?: LoginUser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  if (user)
    await loginFake(page, user)

  return page
}

export const test = base.extend<LdFixtures>({
  login: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (user: LoginUser) => {
      await loginFake(page, user)
    })
  }
})

export { expect } from "@playwright/test"