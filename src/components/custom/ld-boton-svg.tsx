import { cn } from "@/lib/utils"
import React from "react"
import Link from "next/link"
import { Outlined } from "../fx/filtros"

interface CajitaProps {
  children?: React.ReactNode
  classNames?: {
    root?: string
    content?: string
    svg?: string
  }
}

interface CajitaColorProps extends CajitaProps {
  color?: string
  shadowColor?: string
  highlightColor?: string
  brilloColor?: string
  fondo?: string
  disabled?: boolean
}

// Paths extraídos del nuevo SVG (viewBox 0 0 542 209)
// const PATH_FONDO =
//   "M492.845 19.358C453.314 7.316 123.148 29.615 45.165 55.223c-29.006 9.524-49.264 102.316 3.881 134.891 64.023 39.242 369.137 39.639 444.086 8.815 72.255-29.717 60.292-161.118-.287-179.571"
const PATH_BRILLO =
  "M493.081 50.715c14.324 2.484 26.474 12.508 25.508 19.484-.579 4.182-3.898-3.178-16.615-7.233-12.718-4.056-29.403.224-30.526-4.708s9.529-9.641 21.633-7.543"
const PATH_SHADOW =
  "M484.879 51.37c-38.055-9.265-355.896 7.892-430.968 27.595-27.923 7.329-47.425 78.725 3.736 103.789 61.634 30.194 355.357 30.499 427.508 6.782 69.558-22.864 58.041-123.968-.276-138.166"
const PATH_HIGHLIGHT =
  "M484.879 32.173c-38.055-9.265-355.896 7.892-430.968 27.595-27.923 7.329-47.425 78.725 3.736 103.789 61.634 30.194 355.357 30.499 427.508 6.782 69.558-22.864 58.041-123.968-.276-138.166"
const PATH_MAIN =
  "M484.879 40.752c-38.055-9.265-355.896 7.892-430.968 27.595-27.923 7.329-47.425 78.724 3.736 103.788 61.634 30.195 355.357 30.5 427.508 6.783 69.558-22.865 58.041-123.968-.276-138.166"

export function Boton({
  children,
  classNames = {},
  color = "#ccb2ff",
  shadowColor = "#6b34a4",
  highlightColor = "#DDCCFC",
  brilloColor = '#fff',
  disabled = false,
}: CajitaColorProps) {
  return (
    <div className={cn("relative", disabled && "grayscale opacity-70", classNames.root)}>
      <svg
        className={cn("absolute inset-0 w-full h-full", classNames.svg)}
        viewBox="0 0 559 237"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ fillRule: "evenodd", clipRule: "evenodd" }}
      >
        {/* Lo quitamos para hacer el contorno con filtro svg outline
        <path d={PATH_FONDO} fill={color} /> */}
        {/* Highlight lila encima de la sombra */}
        <path d={PATH_HIGHLIGHT} fill={highlightColor} />
        {/* Sombra blanca detrás */}
        <path d={PATH_SHADOW} fill={shadowColor} />
        {/* Cuerpo principal */}
        <path d={PATH_MAIN} fill={color} />
        {/* Brillos */}
        <path d={PATH_BRILLO} fill={brilloColor} />
        <ellipse cx="525.978" cy="79.18" rx="4.021" ry="3.793" fill={brilloColor} />

      </svg>

      <div className={cn("relative", classNames.content)}>{children}</div>
    </div>
  )
}

export function BotonLink({
  titulo,
  url,
  disabled = false,
}: {
  titulo: string
  url: string
  external?: boolean
  disabled?: boolean
}) {
  return (
    <Link href={url} aria-disabled={disabled} className={cn(disabled && "pointer-events-none")}>
      <Outlined outlineColor="black" radius={4}>
        <Boton disabled={disabled} classNames={{ root: "flex items-center justify-center w-52 md:w-[350px] h-20 md:h-32 py-4 hover:scale-110" }}>
          <div className="flex gap-6 items-center pb-2 group cursor-pointer">
            <div className="flex">
              <Outlined radius={2} outlineColor="white" className="text-sm md:text-2xl p-4 text-center font-bold text-black tracking-wide">
                {titulo}
              </Outlined>
            </div>
          </div>
        </Boton>
      </Outlined>
    </Link>
  )
}
