import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import type { OIDCConfig } from 'next-auth/providers'
import { config } from '@/config/entorno'

// IdP falso local (`npm run idp:dev`): mismo flujo OIDC que Google, tokens firmados de mentira.
// IDP_HOST debe coincidir con el del script (localhost, o la IP de la máquina para probar por LAN).
const idpDev: OIDCConfig<Record<string, string>> = {
  id: 'idp-dev',
  name: 'IdP de desarrollo',
  type: 'oidc',
  issuer: `http://${process.env.IDP_HOST ?? 'localhost'}:3006`,
  clientId: 'ludidactas-dev',
  clientSecret: 'ludidactas-dev',
}

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

// El IdP falso y el mock de credenciales (tests) solo existen en dev.
const providers: NextAuthConfig['providers'] = config.esDesarrollo
  ? [Google, idpDev, credencialesMock]
  : [Google]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  // Para poder entrar por IP/LAN y probar desde el cel.
  trustHost: config.esDesarrollo,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Info que va al token:
      if (user?.email) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
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
      return session
    },
    async authorized({ auth }) {
      // A esta altura el token ya está verificado y auth tiene la sesión si el usuario hizo login
      return !!auth
    },
  },
})
