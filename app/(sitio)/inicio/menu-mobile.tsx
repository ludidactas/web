'use client'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { AlignJustify } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export const MenuMobile = () => {
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
        <DropdownMenuContent className="text-right font-bold bg-white/60 text-black  rounded-xl p-4 mr-4" onClick={handleItemClick}>
          <DropdownMenuItem onSelect={handleItemClick}>
            <Link href="/identidad">Identidad</Link>
          </DropdownMenuItem>
          <Separator className="my-1 border border-black border-dashed" />
          <DropdownMenuItem onSelect={handleItemClick}>
            <Link href="/propuestas">Propuestas</Link>
          </DropdownMenuItem>
          <Separator className="my-1 border border-black border-dashed" />
          <DropdownMenuItem onSelect={handleItemClick}>
            <Link href="/sala">Sala</Link>
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
