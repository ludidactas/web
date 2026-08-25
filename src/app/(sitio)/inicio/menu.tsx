'use client'
import Link from 'next/link'
import { ComponentProps, useState } from 'react'
import { AlignJustify } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@radix-ui/react-dropdown-menu'
import { Icon } from '@iconify/react'
import { NavLink } from '@/components/navegacion/nav-link'
import { cn } from '@/lib/utils'

const MENU_LINK_CLASSNAME =
  'p-2 text-xl rounded-md transform hover:rotate-6  hover:border-dashed hover:border-4 hover:border-black '

//version props derivados existentes en Link, para los externos (no navegan dentro de la app)
const MenuLink = (props: ComponentProps<typeof Link>) => <Link {...props} className={MENU_LINK_CLASSNAME} />

//version props derivados existentes en NavLink, para los internos (con feedback de carga)
const MenuNavLink = (props: ComponentProps<typeof NavLink>) => <NavLink {...props} className={MENU_LINK_CLASSNAME} />

const MenuMobile = () => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  const handleItemClick = () => {
    setOpen(false)
  }

  return (
    <div>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger>
          <AlignJustify size={30} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="text-right font-bold bg-white/60 text-black  rounded-xl p-4 mr-4"
          onClick={handleItemClick}
        >
          <DropdownMenuItem onSelect={handleItemClick}>
            <NavLink href="/identidad">Identidad</NavLink>
          </DropdownMenuItem>
          {/* <Separator className="my-1 border border-black border-dashed" /> */}
          {/* <DropdownMenuItem onSelect={handleItemClick}>
            <Link href="/propuestas">Propuestas</Link>
          </DropdownMenuItem> */}
          <Separator className="my-1 border border-black border-dashed" />
          <DropdownMenuItem onSelect={handleItemClick}>
            <NavLink href="/salas">Sala</NavLink>
          </DropdownMenuItem>
          <Separator className="my-1 border border-black border-dashed" />
          <DropdownMenuItem onSelect={handleItemClick}>
            <Link target="_blank" href="https://www.instagram.com/ludidactas/">
              Contacto
            </Link>
          </DropdownMenuItem>
          <Separator className="my-1 border border-black border-dashed" />
          <DropdownMenuItem onSelect={handleItemClick}>
            <Link target="_blank" href="https://ludidactas.medium.com/">
              Blog
            </Link>
            <Separator className="my-1 border border-black border-dashed" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const MenuDesktop = () => (
  <div className="flex gap-4 bg-white/50 items-center mr-10">
    {/* Implementacion version props */}
    <MenuNavLink href="/identidad">
      {(isPending) => (
        <span className={cn(isPending && 'animate-pulse duration-300')}>Identidad</span>
        // Así podría ser con un ícono animado:
        // <span className="inline-flex items-center gap-2">
        //   Identidad
        //   {isPending && <Icon icon="svg-spinners:3-dots-fade" className="h-5 w-5" />}
        // </span>
      )}
    </MenuNavLink>
    {/* <p className="text-2xl">|</p>
    <MenuLink href="/propuestas"> Propuestas </MenuLink> */}
    <p className="text-2xl">|</p>
    <MenuNavLink href="/salas">
      {(isPending) => <span className={cn(isPending && 'animate-pulse duration-300')}>Sala</span>}
    </MenuNavLink>
    <p className="text-2xl">|</p>
    {/* <MenuLink href="/roadmap"> Recursos</MenuLink> */}
    <MenuLink target="_blank" href="https://www.instagram.com/ludidactas/">
      Contacto
    </MenuLink>
    <p className="text-2xl">|</p>
    <MenuLink target="_blank" href="https://ludidactas.medium.com/">
      Blog
    </MenuLink>
  </div>
)

//Renderiza uno u otro según se le indique en
const Menu = () => (
  <>
    <div className="block w-10 lg:hidden">
      <MenuMobile />
    </div>
    <div className="text-4xl hidden lg:block">
      <MenuDesktop />
    </div>
  </>
)

export default Menu
