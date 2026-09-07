import 'next-auth'

declare module 'next-auth' {
  interface Session {
    driveConectado: boolean
  }
}
