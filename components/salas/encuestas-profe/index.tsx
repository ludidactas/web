'use client'

import { CircleDot, Copy, SquareCheckBig } from 'lucide-react'
import Link from 'next/link'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useClipboard from '@/components/hooks/use-clipboard'

import LoadingSala from '../loading-sala'
import { EncuestaSVG } from '../overlay/estadistica-svg'
import { EstadisticaSvgConfig } from '../overlay/estadistica-svg-config'
import { DialogAcciones } from './acciones'
import { AgregarPregunta } from './agregar-pregunta'
import { ListaEncuestas } from './lista-encuestas'
import { ListaEstudiantes } from './lista-estudiantes'
import { Status } from './status'

import { statusesDeCarga, StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEncuestas } from '@/wss-cli/stores/encuestas-store'

export default function EncuestasProfe() {
  const { estado, WssDebugPanel } = useConexionProfe()
  const { items: encuestas } = storeEncuestas()
  const { config: configSala } = storeConfig()

  const encuestaEnfocada = encuestas.find((e) => e.isFocused) || encuestas[0]

  // Configuracion del overlay
  const config: EstadisticaSvgConfig = {
    bg: 'rgba(0, 0, 0, 0.6)',
    barHeight: 60,
    barSpacing: 80,
    titleHeight: 70,
    margin: 10,
  }

  const linkOverlay = configSala.link + 'overlay'

  const { handleCopy, justCopied } = useClipboard()

  if (statusesDeCarga.includes(estado)) {
    return <LoadingSala overlay />
  }

  if (estado === StatusDeConexion.Error || estado === StatusDeConexion.Expirado)
    return <LoadingSala overlay mensaje="Error al conectar con el servidor de salas!" error />

  return (
    <>
      {process.env.NODE_ENV === 'development' && <WssDebugPanel />}

      <Status />

      {/* VISTA MOBILE */}
      <div className="md:hidden animate-aparecer h-fit flex flex-col">
        {/* Menú de Navegación Mobile */}
        {estado === StatusDeConexion.Conectado && (
          <Tabs defaultValue="formulario">
            <TabsList className="rounded-none w-full bg-[#8345FE] text-white">
              <TabsTrigger className="text-xs " value="formulario">
                ¡Haz una pregunta!
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="preguntas">
                Preguntas
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="participantes">
                Participantes
              </TabsTrigger>
            </TabsList>
            <TabsContent value={'formulario'}>
              {/* Vista Formulario - Haz una pregunta */}
              <div className="flex flex-col bg-white p-2" tabIndex={0}>
                <h1 className="text-3xl text-center p-2 text-[#8345FE]">¡Haz una pregunta!</h1>
                <div className="bg-white h-full rounded-b-xl">
                  {configSala.link && (
                    <div className="flex flex-col items-center justify-center gap-1 mb-8">
                      <div className="flex gap-2 text-xl">
                        <p className="leading-normal text-center text-sm">
                          Tu sala:{' '}
                          <Link target="_blank" href={configSala.link} className="text-blue-700 hover:underline">
                            {configSala.link}
                          </Link>
                        </p>
                        <button title="Copiar" onClick={handleCopy(configSala.link)}>
                          {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
                        </button>
                      </div>
                      <p className="text-center text-xs md:text-xl">
                        ¡Compartí el link de la sala con tus estudiantes para que participen de las encuestas!
                      </p>
                    </div>
                  )}

                  {!configSala.link && <p className="text-center p-4 text-rose-500">Link de sala no recibido</p>}

                  {estado === StatusDeConexion.Conectado && (
                    <div className="flex flex-col gap-10">
                      <AgregarPregunta />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preguntas">
              <div className="flex flex-col bg-white">
                <div className="flex flex-col items-center justify-center p-4 h-24">
                  <h1 className="text-3xl text-center text-[#00B0D2]">Lista de Preguntas</h1>
                  <DialogAcciones />
                </div>
                <ListaEncuestas />
              </div>
            </TabsContent>

            <TabsContent value="participantes">
              <div className="flex flex-col bg-white">
                <div className="p-4 min-h-screen">
                  <ListaEstudiantes />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* VISTA DESKTOP (sin cambios) */}
      <div className="hidden md:flex animate-aparecer py-2 gap-2">
        {/* Preguntas Formulario */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl px-2" tabIndex={0}>
          <div className="flex flex-col items-center justify-center p-4 h-24 rounded-t-xl">
            <h1 className="text-3xl md:text-4xl text-center text-[#8345FE]">¡Haz una pregunta!</h1>
          </div>
          <div className="bg-white h-full rounded-b-xl">
            {configSala.link && (
              <div className="flex flex-col items-center justify-center gap-1 mb-8">
                <div className="flex gap-2 text-xl">
                  <p className="leading-normal text-center text-sm md:text-lg">
                    Tu sala:{' '}
                    <Link target="_blank" href={configSala.link} className="text-blue-700 hover:underline">
                      {configSala.link}
                    </Link>
                  </p>
                  <button title="Copiar" onClick={handleCopy(configSala.link)}>
                    {justCopied ? <SquareCheckBig className="text-emerald-700" /> : <Copy />}
                  </button>
                </div>
                <p className="w-96 text-center text-xs text-slate-500">
                  (Comparte el link de la sala con tus estudiantes para que participen de las encuestas)
                </p>
              </div>
            )}

            {!configSala.link && <p className="text-center p-4 text-rose-500">Link de sala no recibido</p>}

            {estado === StatusDeConexion.Conectado && (
              <div className="flex flex-col gap-10">
                <AgregarPregunta />
              </div>
            )}
          </div>
        </div>

        {/* Lista de preguntas */}
        {estado === StatusDeConexion.Conectado && (
          <div className="flex-1 min-w-0 flex flex-col bg-white gap-6 rounded-xl w-[33%] box-content">
            <div className="flex flex-col items-center p-6 h-24 rounded-t-xl">
              <h1 className="text-4xl text-center text-[#00B0D2]">Preguntas</h1>
              <DialogAcciones />
            </div>
            <ListaEncuestas />
          </div>
        )}

        {/* Lista de estudiantes y overlay desktop */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-[70%]">
            <div className="flex h-full flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes />
            </div>
          </div>

          <div className="flex flex-col rounded-xl text-[#6F41CB] items-center bg-white h-[50%]">
            {encuestaEnfocada && (
              <div className="flex flex-col p-6 gap-2 items-center">
                <p className="flex gap-2 font-bold text-2xl items-center">
                  Visualizador vista previa
                  <CircleDot size={30} className="animate-pulse text-emerald-500" />
                </p>
                <div className="flex flex-col">
                  <div className="flex gap-2">
                    <Link target="_blank" href={linkOverlay} className="text-blue-700 hover:underline">
                      {linkOverlay}
                    </Link>
                    <button title="Copiar" onClick={handleCopy(linkOverlay)}>
                      {justCopied ? (
                        <SquareCheckBig className="text-emerald-700 w-4 h-4" />
                      ) : (
                        <Copy size={20} className="hover:cursor-pointer" />
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
