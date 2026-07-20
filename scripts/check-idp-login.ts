// Chequeo manual rápido del login OIDC de dev. Asume `npm run dev` y `npm run idp:dev`
// ya corriendo. No es parte de la suite de tests (para eso: tests/idp-login.spec.ts).
const APP = process.env.APP_HOST ?? 'http://localhost:3000'

const jar = new Map<string, string>()

function cookieHeader() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
}

function guardarCookies(res: Response) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [par] = raw.split(';')
    const [k, v] = par.split('=')
    jar.set(k, v)
  }
}

async function paso(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, redirect: 'manual', headers: { ...init.headers, cookie: cookieHeader() } })
  guardarCookies(res)
  return res
}

async function main() {
  const csrfRes = await paso(`${APP}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()

  const signin = await paso(`${APP}/api/auth/signin/idp-dev`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, callbackUrl: '/salas' }),
  })
  const authorizeUrl = signin.headers.get('location')
  if (!authorizeUrl) throw new Error(`Sin redirect al IdP. ¿Está corriendo 'npm run idp:dev'? (status ${signin.status})`)

  const authorize = await paso(authorizeUrl)
  const callbackUrl = authorize.headers.get('location')
  if (!callbackUrl) throw new Error(`El IdP no devolvió redirect (status ${authorize.status})`)

  const callback = await paso(callbackUrl)
  const finalUrl = callback.headers.get('location')

  const sessionRes = await paso(`${APP}/api/auth/session`)
  const session = await sessionRes.json()

  if (!session?.user) throw new Error(`Sin sesión al final del flujo. Redirect final: ${finalUrl}`)

  console.log('✅ login OIDC OK —', session.user)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
