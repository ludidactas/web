import { Jersey } from "@/components/fonts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify } from "lucide-react";
import Link from "next/link";
import { ComponentProps } from "react";

const MenuMobile = () => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <AlignJustify size={44} />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>MENU</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Link href="/propuestas">Identidad</Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/identidad">Propuestas</Link>
      </DropdownMenuItem>
      {/* <DropdownMenuItem>
        <Link href="https://www.instagram.com/recursos/">Recursos</Link>
      </DropdownMenuItem> */}
      <DropdownMenuItem>
        <Link href="https://www.instagram.com/ludidactas/">Contacto</Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="https://ludidactas.medium.com/">Blog</Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

//version props derivados existentes en Link
const MenuLink = (props: ComponentProps<typeof Link>) => <Link {...props} className="p-2 text-xl bg-white rounded-md hover:bg-black hover:text-white " />

const MenuDesktop = () => <div className="flex gap-4 items-center mr-10">
    {/* Implementacion version props */}
    <MenuLink href="/identidad"> Identidad </MenuLink>
    <p className="text-2xl">|</p>
    <MenuLink href="/propuestas"> Propuestas </MenuLink>
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


//Renderiza uno u otro según se le indique en
const Menu = () => (
  <>
    <div className="block md:hidden">
      <MenuMobile />
    </div>
    <div className={`${Jersey.className} text-4xl hidden md:block`}>
      <MenuDesktop />
    </div>
  </>
)

export default Menu
