import { Link } from "react-scroll";
import { LdSvg } from "./ld-svg";
import ArrowDown from "@/svg/arrowDownSVGO.svg"
import { secuenciar } from "@/lib/utils";

interface ArrowDownLdProps{
    to:string
}
export default function ArrowDownLd({ to }: ArrowDownLdProps){
    return(
      <div className="w-10 lg:w-16 hover:scale-125 ">
             <Link to={to} smooth={true} duration={500}>
                  <LdSvg className='text-2xl m-4 w-full'
              SvgComponent={ArrowDown}
              ids={["uno", "dos", "tres"] as const}
              animation={secuenciar(["uno", "dos", "tres"], 700)}
              

            />
               {/* <Image 
                 src="/img/ArrowDown.gif" 
                 className="[animation:bounce_0.8s_infinite] hover:rounded-full hover:border-2 hover:border-black " 
                 alt="arrowdown" 
                 width={200} 
                 height={200} 
               /> */}
             </Link>
           </div>
         )
}