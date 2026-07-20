import NextAuth, { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import type { OIDCConfig } from 'next-auth/providers'

const esDesarrollo = process.env.NODE_ENV === 'development'

// IdP falso local (`npm run idp:dev`)
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

const providers: NextAuthConfig['providers'] = esDesarrollo ? [idpDev(), credencialesMock] : [Google]

export const proveedorLogin = esDesarrollo ? 'idp-dev' : 'google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
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
