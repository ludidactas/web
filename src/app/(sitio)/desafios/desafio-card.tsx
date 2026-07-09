'use client'
import Link from 'next/link'
import { Boton } from '@/components/custom/ld-boton-svg'
import { Outlined } from '@/components/fx/filtros'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
interface DesafioCardProps {
  numero: number
  nombre: string
  descripcion: string
  imagenUrl: string
  previewUrl: string
  pistas: string[]
  solucionUrl: string
}

const isImagePath = (s: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(s)

const btnContent = (label: string) => (
  <Outlined outlineColor="black" radius={4}>
    <Boton classNames={{ root: 'flex items-center justify-center w-40 h-14 hover:scale-105 transition-transform' }}>
      <div className="flex items-center justify-center pb-1 cursor-pointer">
        <Outlined radius={2} outlineColor="white" className="text-sm font-bold text-black tracking-wide">
          {label}
        </Outlined>
      </div>
    </Boton>
  </Outlined>
)

export function DesafioCard({ numero, nombre, descripcion, imagenUrl, previewUrl, pistas, solucionUrl }: DesafioCardProps) {
  return (
    <div className="flex items-center gap-6 w-full max-w-4xl my-4">
      {/* Número */}
      <Outlined outlineColor="white" radius={3} className="text-7xl font-bold text-[#4c1d95] w-16 text-center shrink-0">
        {numero}
      </Outlined>

      {/* Card preview */}
      <Link href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex-1 hover:scale-[1.02] transition-transform">
        <div className="bg-white/30 border-2 border-white/60 rounded-2xl p-6 min-h-[140px] flex flex-col justify-between shadow">
          <div className="flex-1 rounded-xl mb-4 min-h-[60px] overflow-hidden">
            {imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagenUrl} alt={nombre} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full bg-white/40 rounded-xl min-h-[60px]" />
            )}
          </div>
          <p className="text-center font-semibold text-[#4c1d95] text-lg">{nombre}</p>
          {descripcion && <p className="text-center text-[#4c1d95]/70 text-sm mt-1">{descripcion}</p>}
        </div>
      </Link>

      {/* Botones */}
      <div className="flex flex-col gap-4 shrink-0">
        <Dialog>
          <DialogTrigger asChild>
            <div>{btnContent('Ver pistas')}</div>
          </DialogTrigger>
          <DialogContent className="bg-indigo-100 rounded-2xl border-0">
            <DialogHeader>
              <DialogTitle className="text-[#4c1d95] text-2xl font-bold">Pistas</DialogTitle>
            </DialogHeader>
            <ul className="flex flex-col gap-3 mt-2">
              {pistas.map((pista, i) => (
                <li key={i} className="bg-white/70 rounded-xl p-4 text-[#4c1d95] font-medium">
                  {isImagePath(pista) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pista} alt={`Pista ${i + 1}`} className="w-full rounded-lg" />
                  ) : (
                    <>{i + 1}. {pista}</>
                  )}
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>

        <Link href={solucionUrl} target="_blank" rel="noopener noreferrer">
          {btnContent('Ver solución')}
        </Link>
      </div>
    </div>
  )
}
