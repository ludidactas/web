'use client'
import useLibreta, { Requerimiento } from '@/components/hooks/libreta'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { getMateria, Materia } from '@/md'
import { Meta, Nivel } from '@/md/schema'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { capitalize, entries } from 'remeda'
import { twMerge } from 'tailwind-merge'
import { Drawer } from 'vaul'

const LdDrawer = ({
  articulo,
  isOpen,
  setIsOpen,
}: {
  articulo: string | null
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}) => {
  // Importamos el router
  const router = useRouter()

  const [meta, setMeta] = useState<Meta>({ titulo: 'Nada', descripcion: 'Nada' })

  // Cuando cambie el artículo, updateamos el meta
  useEffect(() => {
    if (!articulo) return setMeta({ titulo: 'Nada', descripcion: 'Nada' })
    const { meta } = getMateria(articulo)
    if (meta) setMeta(meta)
  }, [articulo])

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{meta.titulo}</DrawerTitle>
          <DrawerDescription>
            {meta?.descripcion ??
              `Acá iría la pequeña descripción de ${articulo}, pero no está. Agregarla al front-matter del MD en cuestión con la clave 'descripcion'.`}
          </DrawerDescription>
        </DrawerHeader>

        {articulo && meta.niveles && (
          <div className="max-h-96 overflow-scroll">
            <p className="px-8">Marcá los check a continuación teniendo en cuenta las observaciones:</p>
            {entries(meta.niveles).map(([nivel, unidades]) => (
              <CheckNivel materia={articulo} nivel={nivel} key={nivel} />
            ))}
          </div>
        )}
        <DrawerFooter>
          {/* Navegar a la página del artículo */}
          <Button disabled={!meta?.descripcion} onClick={() => router.push(`/a/${articulo}`)}>
            Acceder
          </Button>
          {/* Cerrar */}
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer.Root>
  )
}

export default LdDrawer

interface CheckNivelProps {
  nivel: Nivel
  materia: string
}

const CheckNivel = ({ materia, nivel }: CheckNivelProps) => {
  const { nivelCompletado, nivelParcial, toggleNivel, unidadesDeNivel } = useLibreta()

  const unidades = unidadesDeNivel(materia as Materia, nivel)

  return (
    <div>
      {/* Checkbox principal */}
      <div className="px-8 py-2 flex gap-2 items-center">
        <Checkbox
          id={nivel}
          checked={
            nivelCompletado(materia as Materia, nivel)
              ? true
              : nivelParcial(materia as Materia, nivel)
              ? 'indeterminate'
              : false
          }
          onClick={() => toggleNivel(materia as Materia, nivel)}
        />
        <label
          htmlFor={nivel}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {capitalize(nivel)}
        </label>
      </div>

      {/* Subchecks */}
      <div className="flex flex-col pl-8">
        {unidades &&
          entries(unidades).map(([unidad, texto]) => (
            <CheckConTooltip materia={materia as Materia} unidad={unidad} texto={texto} key={`${materia}.${unidad}`} />
          ))}
      </div>
    </div>
  )
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CircleDashed, CircleDot } from 'lucide-react'

/**
 * Si la unidad tiene dependencias, le renderiza un tooltip
 */
const CheckConTooltip = (props: { materia: Materia; unidad: string; texto: string }) => {
  const { requerimientosPendientes } = useLibreta()
  const dependencias = requerimientosPendientes(props.materia, props.unidad)

  if (!dependencias || dependencias.length === 0) {
    return <CheckUnidad {...props} />
  }

  const renderRequerimiento = (dep: Requerimiento) => {
    if (dep.nivel) return `Nivel ${dep.nivel} de ${dep.materia}`
    if (dep.unidad) return `Unidad ${dep.unidad} de ${dep.materia}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <CheckUnidad {...props} requerimientos={dependencias} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <p>Esta unidad tiene como dependencia{dependencias.length > 1 ? 's' : ''}: </p>
            {dependencias.map((dep) => (
              <p className="flex items-center gap-2" key={`${dep.materia}.${dep.nivel ?? dep.unidad}`}>
                {dep.pendiente ? <CircleDashed className="inline-block" /> : <CircleDot className="inline-block" />}
                {renderRequerimiento(dep)}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const CheckUnidad = ({
  materia,
  unidad,
  texto,
  requerimientos,
}: {
  materia: Materia
  unidad: string
  texto: string
  requerimientos?: Requerimiento[] | null
}) => {
  const { libreta, toggleUnidad } = useLibreta()
  const requerimientosPendientes = requerimientos?.some((r) => r.pendiente)

  return (
    <div className="px-8 py-2 flex gap-2 items-center" key={unidad}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={unidad}
          className="w-2 h-2"
          checked={libreta[`${materia}.${unidad}`]}
          onClick={() => toggleUnidad(materia, unidad)}
          disabled={requerimientosPendientes}
        />
        <label
          htmlFor={unidad}
          className={twMerge(
            'text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            requerimientosPendientes && 'text-muted-foreground italic cursor-not-allowed'
          )}
        >
          {capitalize(unidad)} : {texto}
        </label>
      </div>
    </div>
  )
}
