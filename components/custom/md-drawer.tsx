import { Dispatch, SetStateAction } from 'react'
import { Drawer } from 'vaul'
import { Button } from '../ui/button'
import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../ui/drawer'

const MdDrawer = ({
  articulo,
  isOpen,
  setIsOpen,
}: {
  articulo: string
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}) => (
  <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{articulo}</DrawerTitle>
        <DrawerDescription>Acá iría la pequeña descripción de {articulo}.</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        <Button>Acceder</Button>
        <Button onClick={() => setIsOpen(false)} variant="outline">
          Cerrar
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer.Root>
)

export default MdDrawer
