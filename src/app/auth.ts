import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import type { OIDCConfig } from 'next-auth/providers'

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de autenticación (next-auth v5).
//
// Este archivo define qué cuentas pueden loguearse (los `providers`) y qué información
// viaja del login a la sesión (los `callbacks`). El resto de la app consume el
// resultado vía los exports `auth`/`signIn`/`signOut`/`handlers`.
//
// Flujo (idéntico en dev y prod, cambia solo el provider):
//   1. El usuario elige un provider → next-auth corre OAuth/OIDC → vuelve con un
//      perfil (email, name, image).
//   2. `callbacks.jwt` copia esos campos al JWT (la sesión es stateless, no hay
//      tabla de sesiones; el token JWT ES la sesión).
//   3. `callbacks.session` expone esos campos al cliente vía `useSession`/`auth()`.
//
// A parte de este, existe `tokenWss()` que emite un JWT distinto con el perfil del profe,
// efímero, para autenticar al cliente en el WSS.
//
// Testing y segregación por entorno: en desarrollo evitamos Google por completo (rechaza
// IPs de LAN, lo que rompe el login desde el celular) y usamos un IdP OIDC falso
// local. Google queda reservado para prod. El gate es `NODE_ENV`, así que los
// providers de dev son físicamente inalcanzables fuera de development.
// ─────────────────────────────────────────────────────────────────────────────

const esDesarrollo = process.env.NODE_ENV === 'development'

// Provider OIDC de desarrollo: apunta al IdP falso local (`npm run idp:dev`).
//
// `issuer` debe coincidir con lo que anuncia el proceso `idp:dev`: ambos
// leen `IDP_HOST` para acordar el host (localhost por defecto, o la IP de LAN).
// clientId/clientSecret son fijos.
function idpDev(): OIDCConfig<Record<string, string>> {
  if (!process.env.IDP_HOST) throw new Error('Falta IDP_HOST')
  return {
    id: 'idp-dev',
    name: 'IdP de desarrollo',
    type: 'oidc',
    issuer: `http://${process.env.IDP_HOST}:3006`,
    clientId: 'ludidactas-dev',
    clientSecret: 'ludidactas-dev',
  }
}

// Provider de credenciales para tests: fabrica una sesión desde un name/email
// crudos, salteando todo el flujo OAuth/OIDC. Complementa al
// `idpDev`: lo usa `loginFake` (ver tests/auth.ts) para autenticar rápido en los
// e2e sin pagar el costo del redirect. Cuando querés verificar el flujo OIDC en
// sí, se usa el IdP falso (ver tests/idp-login.spec.ts).
const credencialesMock = Credentials({
  name: 'Login de Test',
  credentials: {
    name: { label: 'Usuario', type: 'text' },
    email: { label: 'Email', type: 'text' },
  },
  async authorize(credentials) {
    return {
      id: (credentials!.name as string).toLocaleLowerCase().replaceAll(' ', '-'),
      name: credentials!.name as string,
      email: credentials!.email as string,
      image: '/img/logo_sketchy.gif',
    }
  },
})

const providers: NextAuthConfig['providers'] = esDesarrollo ? [idpDev(), credencialesMock, Google] : [Google]

// Gate de prod:
// ID del provider "principal" que dispara el botón de login de la UI
// (`signIn(proveedorLogin)`). En dev apunta al IdP falso; en prod, a Google. El
// mock de credenciales se invoca solo desde tests.
export const proveedorLogin = 'google'

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Info que va al token:
      if (user?.email) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      if (account?.provider === 'google' && account.refresh_token) {
        token.driveRefreshToken = account.refresh_token
      }
      if (trigger === 'update' && session && 'driveRefreshToken' in session) {
        delete token.driveRefreshToken
      }
      return token
    },
    async session({ session, token }) {
      // Info que va a la sesión:
      if (token.email) {
        session.user.email = token.email
        session.user.name = token.name
        session.user.image = token.picture
      }
      session.driveConectado = typeof token.driveRefreshToken === 'string'
      return session
    },
    async authorized({ auth }) {
      // A esta altura el token ya está verificado y auth tiene la sesión si el usuario hizo login
      return !!auth
    },
  },
})
