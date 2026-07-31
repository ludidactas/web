// IdP OIDC falso para desarrollo (`npm run idp:dev`).
//
// Hace de proveedor de identidad (como Google) pero local y bajo nuestro control:
// la app corre contra él el flujo OAuth/OIDC COMPLETO y real. Existe porque Google
// rechaza IPs de LAN, lo que impide probar el login real desde el celular; este
// server sí acepta LAN. Las identidades viven acá, como en un proveedor real.
//
// Contraparte en la app: el provider `idp-dev` de src/app/auth.ts, que apunta a
// `http://${IDP_HOST}:3006`. Ambos procesos leen IDP_HOST para acordar el issuer.
import { OAuth2Server, Events } from 'oauth2-mock-server'

const PUERTO = 3006
const HOST = process.env.IDP_HOST
if (!HOST) throw new Error('Falta IDP_HOST')

// Único usuario que emite este IdP. Todo login termina siendo este profe.
// `sub` es el identificador estable del usuario en OIDC (el "quién").
const identidad = {
  sub: 'profe-test',
  name: 'Profe Test',
  email: 'profe.test@fake.com',
  picture: '/img/logo_sketchy.gif',
}

const server = new OAuth2Server()

// Par de claves RS256 para firmar los id_token (next-auth valida la firma
// contra el JWKS que publica este mismo issuer).
await server.issuer.keys.generate('RS256')

// Inyectamos nuestra identidad en el id_token que se firma...
server.service.on(Events.BeforeTokenSigning, (token) => {
  Object.assign(token.payload, identidad)
})

// ...y en la respuesta del endpoint /userinfo, para que ambas fuentes coincidan.
server.service.on(Events.BeforeUserinfo, (userInfoResponse) => {
  userInfoResponse.body = identidad
})

// Bind en 0.0.0.0 → escucha en toda la red (LAN incluida), necesario para el
// celular. El issuer que ANUNCIA es aparte: lo fija HOST (localhost o la IP de
// LAN) y debe coincidir con el `issuer` que espera el provider en auth.ts.
await server.start(PUERTO, '0.0.0.0')
server.issuer.url = `http://${HOST}:${PUERTO}`
console.log(`IdP de desarrollo: issuer ${server.issuer.url} (bind 0.0.0.0:${PUERTO})`)
