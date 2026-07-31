import { auth } from '@/app/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // De momento solo /salas neceista sesión. Eventualmente ampliamos.
  const requiereAuth = pathname.startsWith('/salas')

  if (requiereAuth && !req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }

  // Logueado en /login → a su callbackUrl interno, o /inicio.
  if (req.auth && pathname === '/login') {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
    const destino = callbackUrl ? new URL(callbackUrl, req.nextUrl.origin) : null
    const target = destino?.origin === req.nextUrl.origin ? destino.pathname : '/inicio'
    return Response.redirect(new URL(target, req.nextUrl.origin))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
