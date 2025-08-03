import { auth, signIn, signOut } from '@/app/auth'

export default async function LoginPage() { 
  const session = await auth()

  if (!session?.user) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <SignIn />
    </div>
  )
  
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      <p>Te conectaste con {session.user.email}!</p>
      <p>{session.user.name}</p>
      <img src={session.user.image} alt="User Avatar" />
      <SignOut />
    </div>
  )
}

export function SignIn() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google')
      }}
    >
      <button className="p-2 border border-black border-b-2 border-r-2" type="submit">Conectarse con Google</button>
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
      <button className="p-2 border border-black border-b-2 border-r-2" type="submit">Cerrar sesión</button>
    </form>
  )
}
