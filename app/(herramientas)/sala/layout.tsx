import { SessionProvider } from 'next-auth/react'

export default function SalaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider>{children}</SessionProvider>
}
