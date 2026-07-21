export { auth as middleware } from '@/app/auth'

export const config = {
  matcher: ['/salas', '/salas/:path*'],
}
