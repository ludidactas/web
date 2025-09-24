import Link from 'next/link'
import { ComponentProps } from 'react'
import { MenuMobile } from './menu-mobile'

//version props derivados existentes en Link
const MenuLink = (props: ComponentProps<typeof Link>) => (
  <Link
    {...props}
    className="p-2 text-xl rounded-md transform hover:rotate-6  hover:border-dashed hover:border-4 hover:border-black "
  />
)

const MenuDesktop = () => (
  <div className="flex gap-4 bg-white/50 items-center mr-10">
    {/* Implementacion version props */}
    <MenuLink href="/identidad"> Identidad </MenuLink>
    <p className="text-2xl">|</p>
    <MenuLink href="/propuestas"> Propuestas </MenuLink>
    <p className="text-2xl">|</p>
    <MenuLink href="/encuestas"> Sala </MenuLink>
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
