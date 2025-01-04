'use client'
import { Button } from '@/components/ui/button'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { esMateria, getMateria } from '@/md'
import { Meta } from '@/md/schema'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import LdMateria from './ld-materia'

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

  const [meta, setMeta] = useState<Meta>({ titulo: 'Nada', descripcion: 'Nada', tipo: 'materia' })

  // Cuando cambie el artículo, updateamos el meta
  useEffect(() => {
    if (!articulo) return setMeta({ titulo: 'Nada', descripcion: 'Nada', tipo: 'materia' })
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

        {articulo && esMateria(articulo) && (
          <div className="p-8 max-h-96 overflow-scroll">
            <LdMateria materia={articulo} />
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
