'use client'
import { SessionProvider } from 'next-auth/react'

export default function HerramientasLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SessionProvider>
    <div className="bg-gradient-to-r from-cyan-200/70 to-indigo-200/70 h-full w-full">
      {children}
    </div>
  </SessionProvider>
}
