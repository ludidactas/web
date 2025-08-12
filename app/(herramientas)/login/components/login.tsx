import Image from "next/image";
import { SignIn } from "./botones";

export default function Login() {
    

    return (
        <div className="flex md:flex-row flex-col md:gap-16 bg-white md:m-20 p-8 md:p-16 shadow-2xl rounded-xl items-center">
            <Image className=" mb-8 w-[200px] md:w-[400px] rounded-full shadow-xl" width={400} height={400} src={"/img/ilustracionLogin.png"} alt={""} />
            <div className="flex flex-col md:h-fit rounded-xl items-center">
                <div className="flex md:w-[30em] items-center gap-4">
                                  <Image className="w-8 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
                                  <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
                                    <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
                                  </div>
                                </div>
                <div className="flex flex-col text-center">
                    <p className="font-bold mt-4 md:text-lg">¡Conectate con tu cuenta de Google!</p>
                    <p className="md:w-[400px] p-8"> Conectate y accede a los recursos que 
                        tenemos disponibles para vos.
                    </p>
                </div>
                <SignIn />
            </div>
            

        </div>
        
    )
}