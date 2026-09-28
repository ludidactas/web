import { accionSignIn, accionSignOut } from './botones-actions'
import { BtnAuth } from '@/components/ui/btn-auth'
import { Icon } from '@iconify/react/dist/iconify.js'

export function SignIn({ redirectTo }: { redirectTo: string }) {
  return (
    <form action={accionSignIn.bind(null, redirectTo)}>
      <BtnAuth type="submit">Conectarse con Google</BtnAuth>
    </form>
  )
}

export function SignOut() {
  return (
    <form action={accionSignOut}>
      <BtnAuth className="hidden sm:flex justify-items-end" type="submit">
        <Icon className='w-6 h-6' icon={"hugeicons:logout-01"}/>
      </BtnAuth>

      <button className="flex sm:hidden" type="submit">
        <Icon className='w-6 h-6' icon={"hugeicons:logout-01"}/>
      </button>
    </form>
  )
}
