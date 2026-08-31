'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post } from '@/lib/blog/posts'
import { cn } from '@/lib/utils'

export default function ArticuloCard({
  post,
  destacado = false,
  onAbrir,
  index = 0,
  className,
}: {
  post: Post
  destacado?: boolean
  onAbrir: (slug: string) => void
  index?: number
  className?: string
}) {
  const { slug, meta } = post
  const categoria = meta.tags?.[0]

  return (
    <a
      href={`/blog/${slug}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        onAbrir(slug)
      }}
      data-aos={index % 2 === 0 ? 'fade-left' : 'fade-right'}
      data-aos-duration="600"
      className={cn('blog-card-aos group block w-full h-full', className)}
    >
      <div
        className={cn(
          'relative flex flex-col justify-end overflow-hidden rounded-2xl w-full aspect-[4/3]',
          destacado ? 'md:aspect-[16/11]' : 'md:aspect-auto md:h-full'
        )}
      >
        {meta.imagen ? (
          <motion.div layoutId={`post-imagen-${slug}`} className="absolute inset-0">
            <Image
              src={meta.imagen}
              alt={meta.titulo}
              fill
              sizes={destacado ? '(min-width: 768px) 60vw, 100vw' : '(min-width: 768px) 40vw, 100vw'}
              className={cn(
                'object-cover transition-transform duration-500 group-hover:scale-105',
                meta.twImagen
              )}
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-ld-violeta/80" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 transition-opacity duration-500 md:group-hover:opacity-100" />

        <div className="relative flex flex-col gap-1 p-5 md:p-6">
          {categoria && (
            <span className="text-xs font-bold uppercase tracking-wide text-white/70">{categoria}</span>
          )}
          <h3 className={cn('font-bold text-white', destacado ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl')}>
            {meta.titulo}
          </h3>
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out md:group-hover:grid-rows-[1fr]">
            <p className="overflow-hidden text-sm text-white/80 line-clamp-3">{meta.resumen}</p>
          </div>
          <p className="text-sm text-white/70">{format(meta.fecha, "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
        </div>
      </div>
    </a>
  )
}
