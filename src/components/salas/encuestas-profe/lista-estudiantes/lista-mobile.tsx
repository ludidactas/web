import { PropsWithChildren, useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'

import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const ListaMobile = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (
    <div className="block lg:hidden self-center">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <h1 className="flex gap-2 text-md font-bold bg-indigo-50 p-4 mb-2 rounded-xl text-indigo-500">
            <Icon icon="lucide:users" className="w-30 self-center" />
            Lista de Participantes
          </h1>
        </DialogTrigger>
        <DialogContent className="overflow-y-auto rounded-xl">
          <DialogTitle />
          {children}
          <DialogClose className="justify-items-center">
            <Icon icon="lucide:x" width={40} height={40} className="bg-indigo-500 text-white  rounded-full p-2" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
