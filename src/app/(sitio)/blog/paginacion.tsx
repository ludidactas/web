import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Paginacion({ paginaActual, totalPaginas }: { paginaActual: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <nav className="flex gap-2 flex-wrap justify-center" aria-label="Paginación del blog">
      {paginas.map((pagina) => (
        <Link
          key={pagina}
          href={pagina === 1 ? '/blog' : `/blog?pagina=${pagina}`}
          aria-current={pagina === paginaActual ? 'page' : undefined}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full font-bold border-2 border-white transition-colors',
            pagina === paginaActual ? 'bg-white text-[#8b5cf6]' : 'bg-white/30 text-white hover:bg-white/50'
          )}
        >
          {pagina}
        </Link>
      ))}
    </nav>
  )
}
