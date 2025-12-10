import { auth } from '@/app/auth'
import { SignOut } from './components/botones'
import Link from 'next/link'
import Login from './components/login'
import Image from 'next/image'

export default async function LoginPage() {
  const session = await auth()

  if (!session?.user) return (
    <div className="flex flex-col items-center bg-gradient-to-r from-cyan-500/70 to-indigo-500/70 justify-center h-[100vh] w-[100vw]">
      <Login />
    </div>
  )

  return (
    <div className="flex flex-col gap-2 items-center bg-cyan-50 justify-center h-screen">
      <div className=' flex flex-col bg-white p-10 rounded-xl items-center justify-center '>
        <div className="flex md:w-[20em] items-center mb-4 gap-4">
          <Image className="w-8 md:w-10" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
          </div>
        </div>
        <p>Ya estás conectadx con </p>
        <span className='text-cyan-600'>{session.user.email}</span>
        <Link href="/sala">
          <div className='flex flex-col items-center my-4 justify-center p-8 gap-4 hover:bg-cyan-600/10 border-2 rounded-xl hover:cursor-pointer'>
            <p className='font-bold'>{session.user.name}</p>
            {session.user.image && <img className='rounded-full w-20' src={session.user.image} alt="User Avatar" />}
            <p className='hover:underline'>Ir a tu sesión</p>
          </div>
        </Link>
        <SignOut />
      </div>
    </div>
  )
}

