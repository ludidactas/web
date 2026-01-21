import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google, 
    // Añadir un proveedor de credenciales **solo en entorno de test**
    ...(process.env.NODE_ENV === 'development' ? [
      Credentials({
        name: 'Login de Test',
        credentials: {
          name: { label: "Usuario", type: "text" },
          email: { label: "Email", type: "text" }
        },
        async authorize(credentials) {
          return {
            id: (credentials.name as string).toLocaleLowerCase().replaceAll(' ', '-'),
            name: credentials.name as string,
            email: credentials.email as string,
            image: 'https://placehold.co/100', // Mock
          }
        }
      })
    ] : [])
  ],
  session: {
    strategy: 'jwt'
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