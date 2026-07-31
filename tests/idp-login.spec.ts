import { expect, test } from '@playwright/test'
import { OAuth2Server, Events } from 'oauth2-mock-server'

// Verifica el LOGIN en sí: click real en el botón → flujo OIDC completo (auth.ts +
// botones-actions.ts + la maquinaria de next-auth) → sesión activa. Es el único
// test que ejercita ese camino: los demás usan `loginFake` (POST crudo que saltea
// la UI y el OIDC) porque solo necesitan estar logueados, no probar el login.
//
// Levantamos nuestro propio IdP falso acá (en vez de reusar `npm run idp:dev`)
// para que el test sea autocontenido: no depende de otro proceso ni de IDP_HOST.
let idp: OAuth2Server

test.beforeAll(async () => {
  idp = new OAuth2Server()
  // Claves para firmar el id_token; next-auth valida la firma contra el JWKS.
  await idp.issuer.keys.generate('RS256')
  // Identidad fija que emite el IdP: todo login resuelve a este usuario.
  idp.service.on(Events.BeforeTokenSigning, (token) => {
    Object.assign(token.payload, { sub: 'test', name: 'Test', email: 'test@fake.com' })
  })
  // Puerto 3006 y host localhost: es el issuer que espera el provider `idp-dev`
  // (con IDP_HOST=localhost). En CI/local alcanza con localhost, no hace falta LAN.
  await idp.start(3006, 'localhost')
})

test.afterAll(async () => {
  // Liberamos el puerto para que no quede colgado entre corridas.
  await idp.stop()
})

test('el botón de login lleva a un login OIDC real y deja logueado', async ({ page }) => {
  await page.goto('/login')
  // El botón dice "Google" pero en dev dispara el provider `idp-dev` (mismo botón,
  // provider distinto según entorno). El browser sigue solo los redirects del OIDC.
  await page.getByRole('button', { name: 'Conectarse con Google' }).click()

  // Señales de éxito: el flujo redirigió a la zona autenticada (/salas)...
  await page.waitForURL(/\/salas/)
  // ...y la UI refleja una sesión abierta (aparece "Cerrar sesión").
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
})
