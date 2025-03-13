'use client'
import { Jersey } from "@/components/fonts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AlignJustify } from "lucide-react";
import Link from "next/link";
import { ComponentProps, useState } from "react";

const MenuMobile = () => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
  };

  const handleItemClick = () => {
    // Close the dropdown
    setOpen(false);
  };

  return (
  <DropdownMenu open={open} onOpenChange={handleOpenChange}>
    <DropdownMenuTrigger>
      <AlignJustify size={30} />
    </DropdownMenuTrigger>
    <DropdownMenuContent onClick={handleItemClick}>
      <DropdownMenuItem>
        <Link href="/identidad">Identidad</Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link href="/propuestas">Propuestas</Link>
      </DropdownMenuItem>
      {/* <DropdownMenuItem>
        <Link href="https://www.instagram.com/recursos/">Recursos</Link>
      </DropdownMenuItem> */}
      <DropdownMenuItem>
        <Link target="_blank" href="https://www.instagram.com/ludidactas/">Contacto</Link>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Link target="_blank" href="https://ludidactas.medium.com/">Blog</Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}

//version props derivados existentes en Link
const MenuLink = (props: ComponentProps<typeof Link>) => <Link {...props} className="p-2 text-xl rounded-md transform hover:rotate-6  hover:border-dashed hover:border-4 hover:border-black " />

const MenuDesktop = () => <div className="flex gap-4 bg-white/50 items-center mr-10">
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
    <div className="block w-10 md:hidden">
      <MenuMobile />
    </div>
    <div className={`${Jersey.className} text-4xl hidden md:block`}>
      <MenuDesktop />
    </div>
  </>
)

export default Menu
