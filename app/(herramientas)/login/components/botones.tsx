import { signIn, signOut } from "@/app/auth"
import { LogOut } from "lucide-react"

export function SignIn({redirectTo} : {redirectTo : string}) {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo })
      }}
    >
      <button className="p-2 border rounded-lg border-black border-b-2 border-r-2  hover:text-teal-600 hover:border-teal-600" type="submit">
        Conectarse con Google
      </button>
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
      <button className="hidden sm:flex justify-items-end p-2 border text-lg w-fit h-fit rounded-lg border-black border-b-2 border-r-2 hover:text-teal-600 hover:border-teal-600" type="submit">
        Cerrar sesión
      </button>

      <button className="flex sm:hidden" type="submit">
      <LogOut/>
      </button>
    </form>
  )
}
