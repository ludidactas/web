'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { getArticulo } from '@/md'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { capitalize, entries } from 'remeda'
import { Drawer } from 'vaul'
import { Button } from '../ui/button'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../ui/drawer'
import useLibreta, { Materia } from '@/components/hooks/libreta'
import { Meta, Nivel } from '@/md/schema'

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
    const { meta } = getArticulo(articulo)
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
  const { nivelCompletado, nivelParcial, toggleNivel, unidadesDeNivel } = useLibreta(materia as Materia)

  const unidades = unidadesDeNivel(nivel)

  return (
    <div>
      {/* Checkbox principal */}
      <div className="px-8 py-2 flex gap-2 items-center">
        <Checkbox
          id={nivel}
          checked={nivelCompletado(nivel) ? true : nivelParcial(nivel) ? 'indeterminate' : false}
          onClick={() => toggleNivel(nivel)}
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
            <CheckUnidad materia={materia as Materia} unidad={unidad} texto={texto} />
          ))}
      </div>
    </div>
  )
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const CheckUnidad = ({ materia, unidad, texto }: { materia: Materia; unidad: string; texto: string }) => {
  const { libreta, requerimientos, toggleUnidad } = useLibreta(materia)
  const pendientes = requerimientos(unidad)

  type ElementType<T> = T extends Array<infer E> ? E : never
  const renderDependencia = (dep: ElementType<ReturnType<typeof requerimientos>>) => {
    if (dep.nivel) return `${dep.materia} nivel ${dep.nivel}`
    if (dep.unidad) return `unidad ${dep.unidad} de ${dep.materia}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="px-8 py-2 flex gap-2 items-center"
            key={unidad}
            onMouseEnter={() => console.log(`Requerimientos de ${unidad}:`)}
          >
            <Checkbox id={unidad} className="w-2 h-2" checked={libreta[unidad]} onClick={() => toggleUnidad(unidad)} />
            <label
              htmlFor={unidad}
              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {capitalize(unidad)} : {texto}
            </label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Esta unidad tiene como dependencia{pendientes.length > 1 ? 's' : ''}:{' '}
            {pendientes.map(renderDependencia).join(', ')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
