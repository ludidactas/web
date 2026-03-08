import { LdSvg } from '@/components/custom/ld-svg'
import { StatusDeConexion } from '@/components/salas/wss-cli/conexion-wss'
import { useConexionEncuestaProfe } from '../wss-cli/providers/encuestas-profe-context'
import EncuestasIcon from '@/svg/EncuestasTitulo.svg'
import Conectado from '@/svg/ConectadoSVGO.svg'
import SalaHeader from '@/svg/EncuestasEstIconSVGO.svg'

export function Status() {
  const { estado } = useConexionEncuestaProfe()
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col mt-4 p-4 rounded-xl">
        <div className="flex justify-between items-center mx-2">
          <div className="flex items-center gap-2">
            <LdSvg className="w-[1000px]" SvgComponent={EncuestasIcon} />
          </div>

          {estado === StatusDeConexion.Conectado ? (
            <span className="text-emerald-500 font-bold animate-pulse text-xs md:text-xl">
              <LdSvg className="w-[150px]" SvgComponent={Conectado} />
            </span>
          ) : (
            <span className="text-red-700 text-xs md:text-xl">Desconectado</span>
          )}
        </div>
      </div>
      {/* Mobile */}
      <div className="flex flex-col md:hidden mt-4 p-4 rounded-xl">
        <LdSvg className="w-[350px]" SvgComponent={SalaHeader} />

        {estado === StatusDeConexion.Conectado ? (
          <span className="text-emerald-500 font-bold animate-pulse text-xs md:text-xl self-end">
            <LdSvg className="w-16 md:w-[150px]" SvgComponent={Conectado} />
          </span>
        ) : (
          <span className="text-red-700 text-xs md:text-xl">Desconectado</span>
        )}
      </div>
    </>
  )
}
