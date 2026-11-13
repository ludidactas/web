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

const PUERTO = Number(process.env.IDP_PUERTO ?? 3006)
const HOST = process.env.IDP_HOST
if (!HOST) throw new Error('Falta IDP_HOST')

type Cuenta = { sub: string; name: string; email: string; picture?: string }

// Cuenta por defecto: la que emite todo login que no pide elegir (el del profe, los tests y `idp:check`).
// `sub` es el identificador estable del usuario en OIDC (el "quién").
const cuentaPorDefecto: Cuenta = {
  sub: 'profe-test',
  name: 'Profe Test',
  email: 'profe.test@fake.com',
  picture: '/img/logo_sketchy.gif',
}

// Cuentas que se ofrecen en el selector, que aparece cuando el login pide `prompt=select_account`
// (lo pide el login del estudiante). Sirven para probar a varias personas distintas.
const cuentas: Cuenta[] = [
  cuentaPorDefecto,
  { sub: 'ana', name: 'Ana Gómez', email: 'ana@fake.com' },
  { sub: 'beto', name: 'Beto Ruiz', email: 'beto@fake.com' },
  { sub: 'caro', name: 'Caro Díaz', email: 'caro@fake.com' },
]

const server = new OAuth2Server()

// Par de claves RS256 para firmar los id_token (next-auth valida la firma
// contra el JWKS que publica este mismo issuer).
await server.issuer.keys.generate('RS256')

// Qué cuenta eligió cada login: el `code` de autorización la ata hasta que se canjea por tokens.
const redirecciones = new Map<string, string>() // code → a dónde volver a la app tras elegir
const cuentaPorCodigo = new Map<string, Cuenta>() // code → cuenta elegida

const buscar = (sub?: string) => cuentas.find((c) => c.sub === sub) ?? cuentaPorDefecto

/** La cuenta de un access token emitido por este IdP (lleva su `sub`), para `/userinfo`. */
function cuentaDeBearer(authorization?: string) {
  const payload = authorization?.replace(/^Bearer /i, '').split('.')[1]
  if (!payload) return cuentaPorDefecto
  try {
    return buscar(JSON.parse(Buffer.from(payload, 'base64url').toString()).sub)
  } catch {
    return cuentaPorDefecto
  }
}

// Si el login pide elegir cuenta, en vez de volver a la app mandamos al selector...
server.service.on(Events.BeforeAuthorizeRedirect, (redireccion, req) => {
  const code = redireccion.url.searchParams.get('code')
  const pideSelector = new URL(req.url ?? '', server.issuer.url).searchParams
    .get('prompt')
    ?.split(' ')
    .includes('select_account')
  if (!code || !pideSelector) return
  redirecciones.set(code, redireccion.url.href)
  // Se muta el URL en su lugar: la librería redirige con el objeto original, no con una propiedad reasignada.
  redireccion.url.href = new URL(`/cuentas?code=${code}`, server.issuer.url).href
})

// ...que muestra las cuentas y, al elegir una, vuelve a la app.
server.service.addRoute('GET', '/cuentas', (req, res) => {
  const { searchParams } = new URL(req.url ?? '', server.issuer.url)
  const code = searchParams.get('code') ?? ''
  const destino = redirecciones.get(code)
  if (!destino) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Login desconocido o ya usado.')
    return
  }

  const elegida = searchParams.get('elegir')
  if (elegida) {
    cuentaPorCodigo.set(code, buscar(elegida))
    redirecciones.delete(code)
    res.writeHead(302, { location: destino }).end()
    return
  }

  const items = cuentas
    .map((c) => `<li><a href="/cuentas?code=${code}&elegir=${c.sub}"><b>${c.name}</b><br>${c.email}</a></li>`)
    .join('')
  res
    .writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    .end(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<title>Elegí una cuenta</title><style>body{font:16px system-ui;max-width:24rem;margin:3rem auto;padding:0 1rem}` +
        `ul{list-style:none;padding:0}a{display:block;padding:.75rem 1rem;margin:.5rem 0;border:1px solid #ccc;border-radius:.5rem;` +
        `color:inherit;text-decoration:none}a:hover{background:#f2f2f2}</style>` +
        `<h2>Elegí una cuenta</h2><p>IdP de desarrollo</p><ul>${items}</ul>`
    )
})

// Inyectamos la identidad en el id_token (y en el access token) que se firma...
server.service.on(Events.BeforeTokenSigning, (token, req) => {
  const code = (req as { body?: { code?: string } }).body?.code
  Object.assign(token.payload, (code && cuentaPorCodigo.get(code)) || cuentaPorDefecto)
})

// ...y en la respuesta del endpoint /userinfo, para que ambas fuentes coincidan.
server.service.on(Events.BeforeUserinfo, (userInfoResponse, req) => {
  userInfoResponse.body = cuentaDeBearer(req.headers.authorization)
})

// Bind en 0.0.0.0 → escucha en toda la red (LAN incluida), necesario para el
// celular. El issuer que ANUNCIA es aparte: lo fija HOST (localhost o la IP de
// LAN) y debe coincidir con el `issuer` que espera el provider en auth.ts.
await server.start(PUERTO, '0.0.0.0')
server.issuer.url = `http://${HOST}:${PUERTO}`
console.log(`IdP de desarrollo: issuer ${server.issuer.url} (bind 0.0.0.0:${PUERTO})`)
