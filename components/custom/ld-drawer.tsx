'use client'
import { Button } from '@/components/ui/button'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Meta } from '@/md/schema'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import LdMateria from './ld-materia'
import { useBiblioteca } from '../context/contenido'

const LdDrawer = ({
  idArticulo,
  isOpen,
  setIsOpen,
}: {
  idArticulo: string | null
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}) => {
  // Importamos el router
  const router = useRouter()

  const [meta, setMeta] = useState<Meta>()

  const { materias } = useBiblioteca()

  // Cuando cambie el artículo, updateamos el meta
  useEffect(() => {
    if (!idArticulo) return setMeta(undefined)
    // Si está en el array de materias ya pasó por la verificación de zod
    const md = materias.find((m) => m.meta.id == idArticulo)
    if (md) setMeta(md.meta)
  }, [idArticulo, materias])

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{meta?.titulo ?? 'No hay meta'}</DrawerTitle>
          <DrawerDescription>
            {meta?.descripcion ??
              `Acá iría la pequeña descripción de ${idArticulo}, pero no está. Agregarla al front-matter del MD en cuestión con la clave 'descripcion'.`}
          </DrawerDescription>
        </DrawerHeader>

        {idArticulo && meta && (
          <div className="p-8 max-h-96 overflow-scroll">
            <LdMateria idMateria={idArticulo} />
          </div>
        )}

        <DrawerFooter>
          {/* Navegar a la página del artículo */}
          <Button disabled={!meta?.descripcion} onClick={() => router.push(`/a/${idArticulo}`)}>
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
