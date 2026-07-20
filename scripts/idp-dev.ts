// IdP OIDC falso para dev: la app corre el flujo OAuth completo contra este server.
// Las identidades viven acá, como en un proveedor real.
import { OAuth2Server, Events } from 'oauth2-mock-server'

const PUERTO = 3006
const HOST = process.env.IDP_HOST
if (!HOST) throw new Error('Falta IDP_HOST')

const identidad = {
  sub: 'profe-test',
  name: 'Profe Test',
  email: 'profe.test@fake.com',
  picture: '/img/logo_sketchy.gif',
}

const server = new OAuth2Server()

await server.issuer.keys.generate('RS256')

server.service.on(Events.BeforeTokenSigning, (token) => {
  Object.assign(token.payload, identidad)
})

server.service.on(Events.BeforeUserinfo, (userInfoResponse) => {
  userInfoResponse.body = identidad
})

// Escucha en toda la red (LAN incluida); el issuer que anuncia lo define HOST.
await server.start(PUERTO, '0.0.0.0')
server.issuer.url = `http://${HOST}:${PUERTO}`
console.log(`IdP de desarrollo: issuer ${server.issuer.url} (bind 0.0.0.0:${PUERTO})`)
