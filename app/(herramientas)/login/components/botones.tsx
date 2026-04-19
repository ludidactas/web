import { signIn, signOut } from '@/app/auth'
import { BtnAuth } from '@/components/ui/btn-auth'
import { LogOut } from 'lucide-react'

export function SignIn({ redirectTo }: { redirectTo: string }) {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo })
      }}
    >
      <BtnAuth type="submit">Conectarse con Google</BtnAuth>
    </form>
  )
}

export function SignOut() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut()
      }}
    >
      <BtnAuth className="hidden sm:flex justify-items-end" type="submit">
        Cerrar sesión
      </BtnAuth>

      <button className="flex sm:hidden" type="submit">
        <LogOut />
      </button>
    </form>
  )
}
