'use client'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { AlignJustify, Link } from "lucide-react"
import { useState } from "react"

export const MenuMobile = () => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  const handleItemClick = () => {
    // Close the dropdown
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger>
        <AlignJustify size={30} />
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={handleItemClick}>
        <DropdownMenuItem>
          <Link href="/inicio">Inicio</Link>
        </DropdownMenuItem>
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
          <Link target="_blank" href="https://www.instagram.com/ludidactas/">
            Contacto
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link target="_blank" href="https://ludidactas.medium.com/">
            Blog
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
