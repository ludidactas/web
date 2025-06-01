import { Link } from "react-scroll";
import { LdSvg } from "./ld-svg";
import ArrowDown from "@/svg/dist/arrowDown.svg"

interface ArrowDownLdProps{
    to:string
}
export default function ArrowDownLd({ to }: ArrowDownLdProps){
    return(
      <div className="w-10 lg:w-16 hover:scale-125 ">
             <Link to={to} smooth={true} duration={500}>
                <LdSvg
                SvgComponent={ArrowDown}
                ids={['uno','dos','tres']as const}
                animation={(nodos, t) => {
                  const i = 500
                  nodos['uno'].attr({ opacity: t % i < i / 2 ? 1 : 0 })
                  nodos['dos'].attr({ opacity: t % i > i / 2 ? 1 : 0 })
                  nodos['tres'].attr({ opacity: t % i < i / 4 ? 1 : 0 })                }}/>
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