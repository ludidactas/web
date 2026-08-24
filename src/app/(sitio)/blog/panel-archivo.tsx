'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Post } from '@/lib/blog/posts'

export default function PanelArchivo({ posts }: { posts: Post[] }) {
  const [busqueda, setBusqueda] = useState('')

  const porAnio = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const filtrados = texto ? posts.filter((post) => post.meta.titulo.toLowerCase().includes(texto)) : posts

    const mapa = new Map<number, Post[]>()
    for (const post of filtrados) {
      const anio = post.meta.fecha.getFullYear()
      if (!mapa.has(anio)) mapa.set(anio, [])
      mapa.get(anio)!.push(post)
    }

    return Array.from(mapa.entries()).sort(([a], [b]) => b - a)
  }, [posts, busqueda])

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-white/80 rounded-2xl p-6 flex flex-col gap-4 lg:sticky lg:top-6">
      <h2 className="text-xl font-bold text-ld-violeta">Buscar entradas</h2>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por título..."
        className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
      />

      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {porAnio.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}

        {porAnio.map(([anio, postsDelAnio]) => (
          <div key={anio} className="flex flex-col gap-1">
            <p className="font-bold text-ld-violeta">{anio}</p>
            <ul className="flex flex-col gap-1">
              {postsDelAnio.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="text-sm text-gray-700 hover:text-[#8b5cf6] hover:underline">
                    {post.meta.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
