'use client'

import LoadingSala from '@/app/(herramientas)/sala/loading'
import useClipboard from '@/components/hooks/use-clipboard'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import { CircleDot, Copy, SquareCheckBig } from 'lucide-react'
import Link from 'next/link'
import { EncuestaSVG } from '../overlay/estadistica-svg'
import { EstadisticaSvgConfig } from '../overlay/estadistica-svg-config'
import { DialogAcciones } from './acciones'
import { AgregarPregunta } from './agregar-pregunta'
import { useEncuestaProfe } from './encuestas-profe-context'
import { ListaEncuestas } from './lista-encuestas'
import { ListaEstudiantes, ListaMobile } from './lista-estudiantes'
import { Status } from './status'

export default function EncuestasProfe() {
  const { linkSala, estado, encuestas, WssDebugPanel } = useEncuestaProfe()

  const encuestaEnfocada = encuestas.find((e) => e.isFocused) || encuestas[0]

  // Configuracion del overlay
  const config: EstadisticaSvgConfig = {
    bg: 'rgba(0, 0, 0, 0.6)', // Cambia el fondo
    barHeight: 60, // Cambia la altura de barras
    barSpacing: 80, // Cambia el espaciado
    titleHeight: 70, // Cambia la altura del título
    margin: 10, //Cambia el margin
  }

  const linkOverlay = linkSala + 'overlay'

  const { handleCopy, justCopied } = useClipboard()

  if (
    [
      StatusDeConexion.Quieto,
      StatusDeConexion.Conectando,
      StatusDeConexion.Autenticando,
      StatusDeConexion.CargandoDependencias,
    ].includes(estado)
  ) {
    return <LoadingSala overlay />
  }

  return (
    <>
      {process.env.NODE_ENV === 'development' && <WssDebugPanel />}

      <Status />
      <div className="flex flex-col md:flex-row p-2 md:py-2 md:gap-2 justify-center">
        {/* Preguntas Formulario*/}
        <div className="flex flex-col bg-white rounded-xl" tabIndex={0}>
          <div className="flex flex-col items-center justify-center p-4 h-24 rounded-t-xl">
            <h1 className="text-xl md:text-3xl text-center text-[#8345FE]">¡Haz una pregunta!</h1>
          </div>
          <div className="bg-white h-full rounded-b-xl">
            {linkSala && (
              <div className="flex flex-col items-center justify-center gap-1 mb-8">
                {/* Link sala */}
                <div className="flex gap-2 text-xl pt-6">
                  <p className="leading-normal text-center text-sm md:text-lg">
                    Tu sala:{' '}
                    <Link target="_blank" href={linkSala} className="text-blue-700 hover:underline">
                      {linkSala}
                    </Link>
                  </p>
                  <button title="Copiar" onClick={handleCopy(linkSala)}>
                    {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
                  </button>
                </div>

                {/* Lista de Participantes Mobile */}
                <ListaMobile>
                  <ListaEstudiantes />
                </ListaMobile>

                {/* Overlay Mobile */}
                {/* <div className='w-full flex flex-col text-indigo-500 font-bold items-center lg:hidden bg-white'>
                    <p>Vista previa </p>
                    <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
                  </div> */}
                {/* </div> */}
              </div>
            )}

            {!linkSala && <p className="text-center p-4 text-rose-500">Link de sala no recibido</p>}

            {/* Formulario Agregar Pregunta */}
            {estado === StatusDeConexion.Conectado && (
              <div className="flex flex-col gap-10">
                <AgregarPregunta />
              </div>
            )}

            {estado === StatusDeConexion.Error ||
              (estado === StatusDeConexion.Expirado && (
                <p className="flex flex-col text-center text-xl gap-2 p-4 ">
                  <span className="text-3xl pb-2">¡Ups!</span>
                  <span>No se puede conectar con el servidor</span>
                  <span>Actualizá la página, o envianos un mensaje a </span>

                  <span className="text-cyan-500">ludidactas.adm@gmail.com</span>
                </p>
              ))}
          </div>
        </div>

        {estado === StatusDeConexion.Conectado && (
          <>
            {/* Lista de Preguntas Mobile */}
            <div className="block mt-2 md:hidden flex-col bg-white gap-6 rounded-xl">
              <div className="flex flex-col justify-center items-center h-24 rounded-t-xl">
                <h1 className="text-3xl text-center text-[#00B0D2]">Preguntas</h1>
                {/* Info para el usuario acerca de acciones */}
                <DialogAcciones />
              </div>
              <ListaEncuestas />
            </div>

            {/* Lista de Preguntas Desktop  */}
            <div className="hidden md:flex md:grow flex-col bg-white gap-6 rounded-xl">
              {/* Header */}
              <div className="flex flex-col items-center p-4 h-24 rounded-t-xl">
                <h1 className="text-3xl text-center text-[#00B0D2]">Preguntas</h1>
                {/* Info para el usuario acerca de acciones */}
                <DialogAcciones />
              </div>
              <ListaEncuestas />
            </div>
          </>
        )}

        {/* Lista de estudiantes y overlay desktop */}
        <div className="flex flex-col gap-4">
          {/* Lista estudiantes */}
          <div className="hidden lg:block">
            <div className="sticky top-0 flex max-h-60 flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          {/* Overlay */}
          <div className="hidden md:flex md:flex-col rounded-xl text-[#6F41CB] items-center bg-white">
            {encuestaEnfocada && (
              <div className="flex flex-col p-2 gap-2 items-center">
                <p className="flex gap-2 font-bold ">
                  Visualizador vista previa
                  <CircleDot absoluteStrokeWidth className="animate-pulse text-emerald-500" />
                </p>
                <div className="flex flex-col">
                  {/* <p className="text-center text-md">Link:</p> */}
                  <div className="flex gap-2">
                    <Link target="_blank" href={linkOverlay} className="text-blue-700 hover:underline">
                      {linkOverlay}
                    </Link>
                    <button title="Copiar" onClick={handleCopy(linkOverlay)}>
                      {justCopied ? (
                        <SquareCheckBig className="text-emerald-700 w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <EncuestaSVG encuesta={encuestaEnfocada} config={config} />
          </div>
        </div>
      </div>
    </>
  )
}
