import { Metadata } from 'next'
import ContenidoBlog from './contenido-blog'
import { obtenerPosts, obtenerPost, type PostRenderizado } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog',
}

const POSTS_POR_PAGINA = 10

export default async function Page({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { pagina } = await searchParams
  const posts = await obtenerPosts()

  const totalPaginas = Math.max(1, Math.ceil(posts.length / POSTS_POR_PAGINA))
  const paginaActual = Math.min(Math.max(1, Number(pagina) || 1), totalPaginas)

  const inicio = (paginaActual - 1) * POSTS_POR_PAGINA
  const postsPagina = posts.slice(inicio, inicio + POSTS_POR_PAGINA)

  const postsConContenido = await Promise.all(postsPagina.map((post) => obtenerPost(post.slug)))

  const postsRenderizados: PostRenderizado[] = postsConContenido
    .filter((post) => post !== null)
    .map(({ slug, meta, Contenido }) => ({ slug, meta, contenido: <Contenido /> }))

  return (
    <ContenidoBlog
      posts={postsRenderizados}
      todosLosPosts={posts}
      paginaActual={paginaActual}
      totalPaginas={totalPaginas}
    />
  )
}
