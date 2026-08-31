'use client'

import { useEffect, useState } from 'react'
import ArticuloCard from './articulo-card'
import ArticuloModal from './articulo-modal'
import WithAOS from '@/components/ui/with-aos'
import type { PostRenderizado } from '@/lib/blog/posts'

function slugDesdeUrl(): string | null {
  return window.location.pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1] ?? null
}

// Función aparte (no un for dentro del componente) porque un for clásico ahí
// confunde el análisis de eslint-plugin-react-hooks@5 y marca useState/useEffect
// como si estuvieran en un loop.
function agruparEnFilas<T>(items: T[], porFila: number): T[][] {
  const filas: T[][] = []
  for (let i = 0; i < items.length; i += porFila) {
    filas.push(items.slice(i, i + porFila))
  }
  return filas
}

export default function BlogGrid({ posts }: { posts: PostRenderizado[] }) {
  const [slugAbierto, setSlugAbierto] = useState<string | null>(null)

  useEffect(() => {
    const slugInicial = slugDesdeUrl()
    if (slugInicial && posts.some((post) => post.slug === slugInicial)) {
      setSlugAbierto(slugInicial)
    }

    function alNavegarHistorial() {
      const slug = slugDesdeUrl()
      setSlugAbierto(slug && posts.some((post) => post.slug === slug) ? slug : null)
    }

    window.addEventListener('popstate', alNavegarHistorial)
    return () => window.removeEventListener('popstate', alNavegarHistorial)
  }, [posts])

  // Usamos pushState directo (no router.push de next/navigation) a propósito:
  // solo queremos cambiar la URL visible para el modal, sin disparar el ciclo
  // de navegación de Next (que re-renderiza la ruta). abrir()/cerrar() ya
  // controlan el estado del modal, así que una navegación real es innecesaria.
  function abrir(slug: string) {
    window.history.pushState(null, '', `/blog/${slug}`)
    setSlugAbierto(slug)
  }

  function cerrar() {
    window.history.pushState(null, '', '/blog')
    setSlugAbierto(null)
  }

  const filas = agruparEnFilas(posts, 2)

  const postAbierto = posts.find((post) => post.slug === slugAbierto) ?? null

  return (
    <WithAOS>
      <div className="flex flex-col gap-6">
        {filas.map((fila, filaIndex) => {
          const anchaEsLaSegunda = filaIndex % 2 === 0

          return (
            <div key={fila[0].slug} className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {fila.map((post, columna) => {
                const filaIncompleta = fila.length === 1
                const esAncha = filaIncompleta || (columna === 1) === anchaEsLaSegunda

                return (
                  <ArticuloCard
                    key={post.slug}
                    post={post}
                    destacado={esAncha}
                    onAbrir={abrir}
                    index={filaIndex * 2 + columna}
                    className={filaIncompleta ? 'md:col-span-5' : esAncha ? 'md:col-span-3' : 'md:col-span-2'}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      <ArticuloModal post={postAbierto} onCerrar={cerrar} />
    </WithAOS>
  )
}
