import { Link } from "react-scroll";
import Image from "next/image";

interface ArrowUpLdProps{
    to:string
    classname?:string
}
export default function ArrowUpLd({ to, classname }: ArrowUpLdProps){
    return(
      <div className={`w-11 lg:w-20 mt-20 hover:scale-125 ${classname}`}>
             <Link to={to} smooth={true} duration={500}>
               <Image 
                 src="/img/ArrowUp.gif" 
                 className="[animation:bounce_0.8s_infinite] hover:rounded-full hover:border-2 hover:border-black " 
                 alt="arrowup" 
                 width={200} 
                 height={200} 
               />
             </Link>
           </div>
         )
}