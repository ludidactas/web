import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlignJustify } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps } from 'react'

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

// const [isOpen, setIsOpen] = useState(false);

// return (
//     <div className="absolute">
//         <button
//             onClick={() => setIsOpen(!isOpen)}
//             className="text-black dark:text-white px-4 py-2 rounded-md"
//         >
//             <AlignJustify size={44} />
//         </button>

//         {/* Dropdown Menu */}
//         {isOpen && (
//             <div className="right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
//                 <ul className="py-2">
//                     <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         <Link href="/inicio">Inicio</Link>
//                     </li>
//                     <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         <Link href="/identidad">Identidad</Link>
//                     </li>
//                     <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         <Link href="/propuestas">Propuestas</Link>
//                     </li>
//                     <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         <Link href="/roadmap">Recursos y roadmap</Link>
//                     </li>
//                     <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
//                         <Link href="/contacto">Contacto</Link>
//                     </li>
//                 </ul>
//             </div>
//         )}
//     </div>
// );

// Version props explícitos
// interface MenuLinkEjemploProps{ href: string, children: ReactNode }
// const MenuLinkEjemplo = ({ href, children }: MenuLinkEjemploProps) => <Link className="todoloquequiera" href={href}>{children}</Link>

//version props derivados existentes en Link
const MenuLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} className="border-2 rounded-[10px] p-2 hover:bg-slate-200" />
)

const MenuDesktop = () => (
  <div className="flex gap-4 items-center p-4">
    {/* Implementacion version props */}
    <MenuLink href="/identidad"> Identidad </MenuLink>
    <MenuLink href="/propuestas"> Propuestas </MenuLink>
    {/* <MenuLink href="/roadmap"> Recursos</MenuLink> */}
    <MenuLink target="_blank" href="https://www.instagram.com/ludidactas/">
      Contacto
    </MenuLink>
    <MenuLink target="_blank" href="https://ludidactas.medium.com/">
      Blog
    </MenuLink>
  </div>
)

//Renderiza uno u otro según se le indique en
const Menu = () => (
  <>
    <div className="block md:hidden">
      <MenuMobile />
    </div>
    <div className="hidden md:block">
      <MenuDesktop />
    </div>
  </>
)

export default Menu
