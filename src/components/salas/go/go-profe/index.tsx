'use client'

import LdGo from '@/components/custom/ld-go'
import { Grid3x3, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Outlined } from '@/components/fx/filtros'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LoadingSala from '../../loading-sala'
import { ListaEstudiantes } from '../../encuestas-profe/lista-estudiantes'
import { Status } from '../../encuestas-profe/status'
import { TabsTriggerLink } from '../../tabs-trigger-link'
import GoProfe from './go-profe'
import { StatusDeConexion, statusesDeCarga } from '@/wss-cli/conexion-wss'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'

/** Título del modo Go, mismo lugar que el banner de Encuestas: ilustración + nombre con contorno. */
const BannerGo = ({ className }: { className: string }) => (
  <div className="flex items-center gap-3 md:gap-4">
    <LdGo className={className} />
    <div className='flex flex-col'>
    <Outlined outlineColor="white" >
      <p className="text-ld-violeta sm:rotate-3 text-5xl md:text-7xl">Go!</p>
    <p className='text-black text-2xl font-bold'>Sumérgete en el mundo del Go!</p>
    </Outlined>
    </div>
  </div>
)

/** Vista del profe para Go: comparte el layout de `EncuestasProfe` (lista a la izquierda,
 * participantes + visualizador a la derecha), pero en vez de la lista de preguntas el profe puede
 * desafiar a los estudiantes de la sala, igual que ellos entre sí. El visualizador queda vacío por
 * ahora: más adelante va a permitir observar partidas en curso. */
export default function GoProfePage() {
  const { estado, WssDebugPanel, error } = useConexionProfe()
  const { config: configSala } = storeConfig()
  const { idSala } = useParams<{ idSala: string }>()

  if (statusesDeCarga.includes(estado)) {
    return <LoadingSala overlay mensaje="Conectando..." />
  }

  if (estado === StatusDeConexion.Error) {
    return <LoadingSala overlay mensaje={error ?? undefined} error />
  }

  if (!configSala) {
    return <LoadingSala overlay mensaje="Esperando config de sala..." />
  }

  return (
    <>
      <WssDebugPanel />
      <Status
        banner={<Outlined radius={3} outlineColor='white'><BannerGo className="md:w-72 h-auto" /></Outlined>}
        bannerMobile={<BannerGo className="w-40 h-auto" />}
      />

      {/* VISTA MOBILE */}
      <div className="md:hidden animate-aparecer h-fit flex flex-col">
        {estado === StatusDeConexion.Conectado && (
          <Tabs defaultValue="go">
            <TabsList className="rounded-none w-full bg-ld-violeta text-white">
              <TabsTriggerLink href={`/salas/${idSala}/encuestas`}>Encuestas</TabsTriggerLink>
              <TabsTrigger className="text-xs flex-1" value="go">
                Go
              </TabsTrigger>
              <TabsTrigger className="text-xs flex-1" value="participantes">
                Participantes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="go">
               
              <div className="flex flex-col items-center p-6 h-screen bg-white">

                <h1 className="flex gap-2 items-center text-3xl font-medium text-ld-violeta-oscuro">
                    <Grid3x3 />
                    Partidas
                  </h1>
    
                  <div className="w-full pt-4">
                    <GoProfe />
                  
                </div>
              </div>
            </TabsContent>

            <TabsContent value="participantes">
              <div className="flex flex-col bg-white">
                <div className="p-4 min-h-screen">
                  <ListaEstudiantes modo="go" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* VISTA DESKTOP */}
      <div className="hidden md:flex flex-1 min-h-0 animate-aparecer py-2 gap-2 mb-2">
        {/* Lista de partidas / desafío */}
        {estado === StatusDeConexion.Conectado && (
          <div className="w-3/5 min-w-0 flex flex-col bg-white gap-2 rounded-xl box-content overflow-y-auto">
            <div className="flex items-center p-6 justify-center rounded-t-xl">
              <h1 className="flex gap-2 text-5xl font-medium text-ld-violeta-oscuro">
                <Grid3x3 size={40} />
                Partidas
              </h1>
            </div>
            <div className="px-10 pb-10">
              <GoProfe />
            </div>
          </div>
        )}

        {/* Lista de estudiantes y visualizador desktop */}
        <div className="w-2/5 min-w-0 flex flex-col gap-2">
          {/* Lista de estudiantes */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="flex h-full flex-col gap-4 bg-white rounded-xl p-8">
              <ListaEstudiantes modo="go" />
            </div>
          </div>

          {/* Visualizador: vacío por ahora, más adelante permite observar partidas */}
          <div className="relative flex-1 min-h-0 max-h-[40%] flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl text-ld-violeta-oscuro bg-white">
            <p className="flex items-center justify-center gap-2 text-ld-violeta text-center text-2xl">
              <Search size={20} /> Visualizador
            </p>
            <p className="text-slate-400 italic text-sm text-center px-6">
              Próximamente vas a poder observar partidas en vivo acá.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
