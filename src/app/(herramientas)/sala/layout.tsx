import { auth } from '@/app/auth'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from 'next-auth/react'

export default async function SalaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <TooltipProvider>{children}</TooltipProvider>
    </SessionProvider>
  )
}
