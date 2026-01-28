import { SessionProvider } from 'next-auth/react'
import TestClient from './cliente'

export default async function PingPage() {
  return (
    <SessionProvider>
      <TestClient />
    </SessionProvider>
  )
}
