'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { getArticulo } from '@/md'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { capitalize, entries } from 'remeda'
import { Drawer } from 'vaul'
import { Button } from '../ui/button'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../ui/drawer'
import useLibreta, { Materia, Nivel } from '@/components/hooks/libreta'
import { Meta } from '@/mdx'

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

  const [meta, setMeta] = useState<Meta>({})

  // Cuando cambie el artículo, updateamos el meta
  useEffect(() => {
    if (!articulo) return setMeta({})
    const { meta } = getArticulo(articulo)
    setMeta(meta ?? {})
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
              <CheckNivel materia={articulo} nivel={nivel as Nivel} key={nivel} />
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
  const { libreta, nivelCompletado, nivelParcial, toggleNivel, toggleUnidad, unidadesDeNivel } = useLibreta(
    materia as Materia
  )

  const unidades = unidadesDeNivel(nivel)

  return (
    <div>
      {/* Checkbox principal */}
      <div className="px-8 py-2 flex gap-2 items-center">
        {/* <Checkbox id={nivel} checked={nivelSeteado(nivel)} onClick={() => toggleNivel(nivel)} /> */}
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
          entries(unidades).map(([unid, texto]) => (
            <div className="px-8 py-2 flex gap-2 items-center" key={unid}>
              <Checkbox id={unid} className="w-2 h-2" checked={libreta[unid]} onClick={() => toggleUnidad(unid)} />
              <label
                htmlFor={unid}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {texto}
              </label>
            </div>
          ))}
      </div>
    </div>
  )
}
