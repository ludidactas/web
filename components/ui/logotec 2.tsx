'use client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'
import Image from 'next/image';

export const LogoTec = ({ nombre, url, descripcion }: { nombre: string; url: string; descripcion: string }) => {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      {' '}
      {/* Disables hover delay */}
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger onClick={() => setOpen(!open)}>
          <Image className="w-fit h-fit lg:w-full lg:h-full " src={url} width={100} height={100} alt="" />
        </TooltipTrigger>
        <TooltipContent className="bg-black text-center text-white w-[20em] p-5">
          <h1 className="text-2xl pb-2 text-[#4198AA]">{nombre}</h1>
          <p className="text-center">{descripcion}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
