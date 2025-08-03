import { auth } from '@/app/auth'
import { SignIn, SignOut } from './components/botones'

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

