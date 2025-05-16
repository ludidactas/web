'use client'
import { LdSvg } from "@/components/custom/ld-svg"
import CajaTexto from "@/svg/CajaTexto.svg"

export default function Page(){
    const mensaje=<p>sdkjhaskdhsakjd</p>
    
    return<LdSvg 
    SvgComponent={CajaTexto}
    ids={["uno", "dos"] as const}
    animation={(t,nodos)=>{
    const i=500
        nodos['uno'].attr({opacity:t%i < i/2? 1:0})
        nodos['dos'].attr({opacity:t%i > i/2? 1:0})
    }}
    slots={{'slot':mensaje}as const}    
    
    />
}