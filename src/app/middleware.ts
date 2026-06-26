export { auth as middleware } from '@/app/auth'

export const config = {
  matcher: ['/sala/:path*', '/salas', '/salas/:path*'],
}
