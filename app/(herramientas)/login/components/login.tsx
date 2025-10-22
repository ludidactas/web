import Image from 'next/image'
import { SignIn } from './botones'
import Ilustracion from './ilustracion'

export default function Login() {
  return (
    <div className="h-screen self-normal flex drop-shadow-xl flex-col md:flex-row md:gap-16 bg-white md:m-40 p-8 md:p-10 md:rounded-xl items-center justify-center">
      <Ilustracion />
      <div className="flex flex-col md:h-fit md:mr-8 items-center">
        <div className="flex md:w-[30em] items-center gap-4">
          <Image className="w-8 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
          </div>
        </div>
        <div className="flex flex-col text-center">
          <p className="font-bold mt-4 text-xs md:text-xl">¡Conectate con tu cuenta de Google!</p>
          <p className="w-[300px] md:w-[400px] p-8 text-xs md:text-xl">
            {' '}
            Conectate y accede a los recursos que tenemos disponibles para vos.
          </p>
        </div>
        <SignIn redirectTo="/sala" />
      </div>
    </div>
  )
}
