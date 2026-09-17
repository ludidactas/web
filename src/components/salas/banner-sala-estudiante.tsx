import { ReactNode } from 'react'
import { Outlined } from '@/components/fx/filtros'

/** Banner de cabecera de las páginas de la sala del estudiante (Encuestas, Go, etc.), para que
 * todas ocupen el mismo lugar y no "salten" al alternar entre ellas con el nav flotante. */
export function BannerSalaEstudiante({
  icono,
  titulo,
  subtitulo,
  aviso,
}: {
  icono: ReactNode
  titulo: string
  subtitulo: string
  aviso?: ReactNode
}) {
  return (
    <div className="flex items-center gap-8">
      <Outlined radius={3} outlineColor="white" className="flex rounded-full">
        {icono}
      </Outlined>

      <div className="items-center justfy-center">
        <Outlined radius={4} outlineColor="white" className="flex flex-col sm:block">
          <p className="text-ld-violeta text-4xl md:text-7xl rotate-3">{titulo}</p>
          <p className="text-xs md:text-3xl text-black">{subtitulo}</p>
          {aviso}
        </Outlined>
      </div>
    </div>
  )
}
