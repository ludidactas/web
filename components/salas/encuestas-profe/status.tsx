import { LdSvg } from '@/components/custom/ld-svg'
import EncuestasIcon from '@/svg/dist/encuestas/EncuestasTitulo.svg'
import Conectado from '@/svg/dist/ui/ConectadoSVGO.svg'
import SalaHeader from '@/svg/dist/encuestas/EncuestasEstIconSVGO.svg'

import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'

export function Status() {
  const { estado } = useConexionProfe()
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
