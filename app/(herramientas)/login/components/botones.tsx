import { signIn, signOut } from "@/app/auth"

export function SignIn() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo: '/encuestas' })
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
      <button className="md:p-2 border w-20 h-10 text-xs md:text-lg md:w-fit md:h-fit rounded-lg border-black border-b-2 border-r-2 hover:text-teal-600 hover:border-teal-600" type="submit">
        Cerrar sesión
      </button>
    </form>
  )
}
