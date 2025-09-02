import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      // Info que va al token:
      if (user?.email) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      // Info que va a la sesión:
      if (token.email) { 
        session.user.email = token.email
        session.user.name = token.name 
      }
      return session
    }
  },
})