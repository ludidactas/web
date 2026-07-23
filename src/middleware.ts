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

  // Si está logueado y va a login, redirige a inicio
  if (req.auth && pathname === '/login') {
    return Response.redirect(new URL('/inicio', req.nextUrl.origin))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
