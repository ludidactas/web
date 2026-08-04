// Script standalone de diagnóstico (`npm run idp:check`). Cliente HTTP para chequear rápido,
// sin levantar Playwright, que el login OIDC de dev funciona de punta a punta.
//
// Asume `npm run dev` y `npm run idp:dev` ya corriendo. Recorre a pie los mismos
// endpoints que pegaría un browser y verifica que al final haya sesión.
//
// APP_HOST permite apuntar a otra máquina (ej: probar por LAN contra la IP real).
const APP = process.env.APP_HOST ?? 'http://localhost:3000'

/**
 * Cookie store en memoria (nombre → valor).
 *
 * Un browser mantiene las cookies solo; un `fetch` pelado no. next-auth apoya
 * todo el handshake (CSRF, state, sesión) en cookies, así que sin propagarlas
 * entre requests el flujo se corta. Este jar mínimo hace ese trabajo: guarda las
 * cookies que devuelve cada response y las reenvía en la siguiente.
 */
const jar = new Map<string, string>()

/** Serializa el jar al formato del header `Cookie` (`k1=v1; k2=v2`). */
function cookieHeader() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
}

/**
 * Lee los `Set-Cookie` de una response y los vuelca al jar. Nos quedamos solo con
 * el par nombre=valor, descartando atributos como Path/HttpOnly que no reenviamos.
 */
function guardarCookies(res: Response) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [par] = raw.split(';')
    const [k, v] = par.split('=')
    jar.set(k, v)
  }
}

/**
 * Un request del flujo: manda las cookies acumuladas, NO sigue redirects
 * automáticamente (los seguimos a mano para inspeccionar cada `Location`) y
 * guarda las cookies nuevas antes de devolver la response.
 */
async function paso(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, redirect: 'manual', headers: { ...init.headers, cookie: cookieHeader() } })
  guardarCookies(res)
  return res
}

async function main() {
  // 1. Pedimos el CSRF token que next-auth exige para iniciar cualquier login.
  const csrfRes = await paso(`${APP}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()

  // 2. Iniciamos el login con el provider `idp-dev`. next-auth responde con un
  //    redirect (Location) hacia el endpoint /authorize del IdP falso.
  const signin = await paso(`${APP}/api/auth/signin/idp-dev`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, callbackUrl: '/salas' }),
  })
  const authorizeUrl = signin.headers.get('location')
  if (!authorizeUrl)
    throw new Error(`Sin redirect al IdP. ¿Está corriendo 'npm run idp:dev'? (status ${signin.status})`)

  // 3. Seguimos al IdP: autentica (siempre el mismo usuario falso) y redirige de
  //    vuelta al callback de la app con el `code`.
  const authorize = await paso(authorizeUrl)
  const callbackUrl = authorize.headers.get('location')
  if (!callbackUrl) throw new Error(`El IdP no devolvió redirect (status ${authorize.status})`)

  // 4. Golpeamos el callback: acá next-auth canjea el code por el token, arma la
  //    sesión (setea la cookie de sesión) y redirige a la app.
  const callback = await paso(callbackUrl)
  const finalUrl = callback.headers.get('location')

  // 5. Con la cookie de sesión ya en el jar, /session debe devolver el usuario.
  const sessionRes = await paso(`${APP}/api/auth/session`)
  const session = await sessionRes.json()

  if (!session?.user) throw new Error(`Sin sesión al final del flujo. Redirect final: ${finalUrl}`)

  console.log('✅ login OIDC OK —', session.user)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
