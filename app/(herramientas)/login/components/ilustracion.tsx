'use client'
import { LdSvg } from "@/components/custom/ld-svg"
import ilustracionProfe from "@/svg/IlustracionProfe3.svg"
import { oscilar} from "@/lib/animaciones"
 
export default function Ilustracion (){
    return <LdSvg 
    className="w-[300px] md:w-[600px] drop-shadow-xl" 
    SvgComponent={ilustracionProfe}
    ids={['uno', 'dos', 'tres', 'cuatro'] as const}
    animation={oscilar(['uno', 'dos', 'tres'], 2, 1, 0.4)}/>

}