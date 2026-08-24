'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PostRenderizado } from '@/lib/blog/posts'

const TRANSICION_IMAGEN = { type: 'spring', visualDuration: 0.2, bounce: 0.15 } as const

export default function ArticuloModal({
  post,
  onCerrar,
}: {
  post: PostRenderizado | null
  onCerrar: () => void
}) {
  const [imagenLista, setImagenLista] = useState(false)

  useEffect(() => {
    if (post) setImagenLista(!post.meta.imagen)
  }, [post?.slug]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DialogPrimitive.Root open={!!post} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <AnimatePresence>
        {post && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div className="fixed inset-0 z-50 overflow-y-auto p-4 py-10 md:p-10">
                <motion.div
                  layoutId={`post-${post.slug}`}
                  transition={TRANSICION_IMAGEN}
                  className="relative mx-auto w-full max-w-3xl"
                >
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-[#fcfcfc] shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imagenLista ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />

                  <DialogPrimitive.Title className="sr-only">{post.meta.titulo}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">{post.meta.resumen}</DialogPrimitive.Description>

                  <DialogPrimitive.Close className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60">
                    <span className="sr-only">Cerrar</span>
                    <span aria-hidden>✕</span>
                  </DialogPrimitive.Close>

                  {post.meta.imagen && (
                    <motion.div
                      layoutId={`post-imagen-${post.slug}`}
                      transition={TRANSICION_IMAGEN}
                      onLayoutAnimationComplete={() => setImagenLista(true)}
                      className="relative h-64 w-full overflow-hidden rounded-t-3xl md:h-80"
                    >
                      <Image
                        src={post.meta.imagen}
                        alt={post.meta.titulo}
                        fill
                        sizes="768px"
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  )}

                  {imagenLista && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative flex flex-col gap-4 p-6 md:p-10"
                    >
                      <h2 className="text-3xl font-bold text-ld-violeta md:text-4xl">{post.meta.titulo}</h2>
                      <p className="text-muted-foreground">
                        {format(post.meta.fecha, "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>

                      <div className="flex flex-col gap-4 text-lg leading-relaxed text-gray-800 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_hr]:my-2 [&_hr]:border-gray-300">
                        {post.contenido}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
