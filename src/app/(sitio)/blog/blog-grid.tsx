'use client'

import { useEffect, useState } from 'react'
import ArticuloCard from './articulo-card'
import ArticuloModal from './articulo-modal'
import WithAOS from '@/components/ui/with-aos'
import type { PostRenderizado } from '@/lib/blog/posts'

function slugDesdeUrl(): string | null {
  return window.location.pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1] ?? null
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

  function abrir(slug: string) {
    window.history.pushState(null, '', `/blog/${slug}`)
    setSlugAbierto(slug)
  }

  function cerrar() {
    window.history.pushState(null, '', '/blog')
    setSlugAbierto(null)
  }

  const filas: PostRenderizado[][] = []
  for (let i = 0; i < posts.length; i += 2) {
    filas.push(posts.slice(i, i + 2))
  }

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
