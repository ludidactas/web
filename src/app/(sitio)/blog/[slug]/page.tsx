import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { obtenerPost, obtenerPostsVecinos } from '@/lib/blog/posts'
import { Title } from '@/components/custom/ld-title'
import { NavLinkPulso } from '@/components/navegacion/nav-link-pulso'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await obtenerPost(slug)
  return { title: post?.meta.titulo ?? 'Blog' }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const post = await obtenerPost(slug)

  if (!post) notFound()

  const { meta, Contenido } = post
  const { anterior, siguiente } = await obtenerPostsVecinos(slug)

  return (
    <article className="flex flex-col w-full max-w-5xl bg-[#fcfcfc]/10 backdrop-blur-sm p-6 my-4 md:my-24 gap-6">
      <NavLinkPulso href="/blog" className="text-[#8b5cf6] font-bold hover:underline w-fit">
        ← Volver al blog
      </NavLinkPulso>

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl text-ld-violeta">{meta.titulo}</h1>
        <p className="text-muted-foreground">{format(meta.fecha, "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
      </div>

      {meta.imagen && (
        <div className="relative w-full h-64 md:h-96 rounded-3xl overflow-hidden">
          <Image src={meta.imagen} alt={meta.titulo} fill sizes="768px" className="object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-4 text-lg leading-relaxed p-10 text-gray-800 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_hr]:my-2 [&_hr]:border-gray-300">
        <Contenido />
      </div>

      <div className="flex flex-col gap-4 border-t pt-6">
        <NavLinkPulso href="/blog" className="text-[#8b5cf6] font-bold hover:underline w-fit">
          ← Volver al blog
        </NavLinkPulso>

        <div className="flex items-center justify-between gap-4">
          {anterior ? (
            <NavLinkPulso href={`/blog/${anterior.slug}`} className="text-[#8b5cf6] font-bold hover:underline w-fit">
              ← Leer anterior: {anterior.meta.titulo}
            </NavLinkPulso>
          ) : (
            <span />
          )}

          {siguiente && (
            <NavLinkPulso
              href={`/blog/${siguiente.slug}`}
              className="text-[#8b5cf6] font-bold hover:underline w-fit text-right"
            >
              Leer siguiente: {siguiente.meta.titulo} →
            </NavLinkPulso>
          )}
        </div>
      </div>
    </article>
  )
}
