'use client'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../ui/drawer'
import { capitalize } from 'remeda'
import { getArticulo } from '@/md'

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

  const [meta, setMeta] = useState<Record<string, any>>({})

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
