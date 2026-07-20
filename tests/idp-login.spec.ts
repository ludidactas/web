import { expect, test } from '@playwright/test'
import { OAuth2Server, Events } from 'oauth2-mock-server'

// Corremos auth.ts + botones-actions.ts a través del botón real, atravesando el flujo OIDC completo. 
// A diferencia de loginFake (POST crudo, saltea la UI), pasamos por el click real. 
// Levantamos y apagamos el IdP falso aca mismo.
let idp: OAuth2Server

test.beforeAll(async () => {
  idp = new OAuth2Server()
  await idp.issuer.keys.generate('RS256')
  idp.service.on(Events.BeforeTokenSigning, (token) => {
    Object.assign(token.payload, { sub: 'test', name: 'Test', email: 'test@fake.com' })
  })
  await idp.start(3006, 'localhost')
})

test.afterAll(async () => {
  await idp.stop()
})

test('el botón de login lleva a un login OIDC real y deja logueado', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Conectarse con Google' }).click()

  await page.waitForURL(/\/salas/)
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
})
