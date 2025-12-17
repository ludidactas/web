import { LdSvg } from "@/components/custom/ld-svg"
import { StatusDeConexion } from "@/components/hooks/use-conexion-wss"
import { useEncuestaProfe } from "./encuestas-profe-context"
import EncuestasIcon from '@/svg/EncuestasTitulo.svg'
import Conectado from '@/svg/ConectadoSVGO.svg'


export function Status() {
  const { estado } = useEncuestaProfe()
  return (

    <div className='flex flex-col mt-4 p-4 rounded-xl'>
      <div className='flex justify-between items-center mx-2'>
        <div className="flex items-center gap-2">
          <LdSvg className="w-16 md:w-[1000px]" SvgComponent={EncuestasIcon} />
          {/* <div className='flex flex-col items-start'>
            <h1 className="text-3xl md:text-6xl font-bold text-[#6F41CB] text-outline-white">Encuestas</h1>
            <p className='hidden md:flex md:text-center md:w-full md:text-xl'>¡Haz preguntas en vivo y compártelas a través del link de la sala!</p>
          </div> */}
        </div>

        {estado === StatusDeConexion.Conectado ? (
          <span className="text-emerald-500 font-bold animate-pulse text-xs md:text-xl">
            <LdSvg className="w-16 md:w-[150px]" SvgComponent={Conectado} />
          </span>
        ) : (
          <span className="text-red-700 text-xs md:text-xl">Desconectado</span>
        )}
      </div>
      <p className='flex md:hidden text-center text-xs p-2'>¡Haz preguntas en vivo y compártelas a través del link de la sala!</p>

    </div>

  )
}