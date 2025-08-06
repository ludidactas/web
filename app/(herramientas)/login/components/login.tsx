import Image from "next/image";
import { SignIn } from "./botones";

export default function Login() {
    return (
        
        <div className="flex gap-16 bg-white m-20 p-16 shadow-inset shadow-2xl rounded-xl items-center">
            

            <Image className="rounded-full shadow-xl" width={400} height={400} src={"/img/ilustracionLogin.png"} alt={""} />
            <div className="flex flex-col h-fit rounded-xl items-center">
                {/* <div className="flex gap-4 items-center">
                    <Image className="h-14 w-14" width={50} height={100} src={"/img/Logo.png"} alt={"Logo"} />
                    <Image className='h-10 w-100' width={300} height={50} src={"/img/Lema.png"} alt={"Nombre"} />
                </div> */}
                <div className="flex md:w-[30em] items-center gap-4">
                                  <Image className="w-8 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
                                  <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
                                    <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
                                  </div>
                                </div>
                <div className="flex flex-col text-center">
                    <p className="font-bold mt-4 text-lg">¡Conectate con tu cuenta de Google!</p>
                    <p className="w-[400px] p-8"> Conectate y accede a los recursos que 
                        tenemos disponibles para vos.
                    </p>
                </div>
                <SignIn />
            </div>
            

        </div>
        
    )
}