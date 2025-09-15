import { SessionProvider } from 'next-auth/react'

export default function HerramientasLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider>{children}</SessionProvider>
}
