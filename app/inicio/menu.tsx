"use client"
import { AlignJustify } from "lucide-react";
import React, { useState } from "react";
import IdentidadComp from "../identidad/IdentidadComp";
import Link from "next/link";

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-black dark:text-white px-4 py-2 rounded-md"
            >
                <AlignJustify size={44} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                    <ul className="py-2">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <Link href="/inicio">Inicio</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <Link href="/identidad">Identidad</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <Link href="/propuestas">Propuestas</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <Link href="/recursos">Recursos y roadmap</Link>
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <Link href="/contacto">Contacto</Link>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Menu;
