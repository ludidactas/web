// "use client"
// import { AlignJustify } from "lucide-react";
// import React, { useState } from "react";
// import IdentidadComp from "../identidad/IdentidadComp";
// import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { AlignJustify } from "lucide-react";
import Link from "next/link";
import { ComponentProps } from "react";


const MenuMobile = () =>
    <DropdownMenu>
        <DropdownMenuTrigger className="block md:hidden">
            <AlignJustify size={44} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel>MENU</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Identidad</DropdownMenuItem>
            <DropdownMenuItem>Propuestas</DropdownMenuItem>
            {/* <DropdownMenuItem>Recursos</DropdownMenuItem> */}
            <DropdownMenuItem>Contacto</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>



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
const MenuLink = (props: ComponentProps<typeof Link>) => <Link {...props} className="p-2 text-xl bg-white rounded-md hover:bg-black hover:text-white " />

const MenuDesktop = () => <div className="flex gap-4 items-center mr-10">
    {/* Implementacion version props */}
    <MenuLink href="/identidad"> Identidad </MenuLink>
    <p className="text-2xl">|</p>
    <MenuLink href="/propuestas"> Propuestas </MenuLink>
    <p className="text-2xl">|</p>
    {/* <MenuLink href="/roadmap"> Recursos</MenuLink> */}
    <MenuLink target="_blank" href="https://www.instagram.com/ludidactas/"> Contacto </MenuLink>
    <p className="text-2xl">|</p>   
    <MenuLink target="_blank" href="https://ludidactas.medium.com/"> Blog </MenuLink>

</div>

//Renderiza uno u otro según se le indique en
const Menu = () =>
    <>
        <MenuMobile />
        <MenuDesktop />
    </>


export default Menu;
