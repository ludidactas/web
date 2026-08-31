import { Title } from '@/components/custom/ld-title'
import BlogGrid from './blog-grid'
import Paginacion from './paginacion'
import PanelArchivo from './panel-archivo'
import type { Post, PostRenderizado } from '@/lib/blog/posts'

export default function ContenidoBlog({
  posts,
  todosLosPosts,
  paginaActual,
  totalPaginas,
}: {
  posts: PostRenderizado[]
  todosLosPosts: Post[]
  paginaActual: number
  totalPaginas: number
}) {
  return (
    <div className="flex flex-col my-4 md:my-20 w-full min-h-full">
      <div className="flex flex-col gap-10 my-4 md:my-10 px-6 md:px-16 text-xl">
        <Title text="Blog" color="text-ld-violeta" size="text-5xl md:text-7xl" />
        <p>Decidimos mudar nuestras publicaciones a un espacio propio dentro de nuestro sitio.
          Esto nos permite tener más autonomía sobre el contenido y, de a poco, ir sumando funcionalidades pensadas para nuestra comunidad.
          Próximamente estaremos sumando material nuevo. </p>
          <p>¡Gracias por acompañarnos!</p>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8 px-6 md:px-16 pb-16 w-full">
        <div className="flex flex-col gap-6 w-full lg:flex-1">
          {posts.length === 0 ? (
            <p className="text-white text-xl">Todavía no hay entradas publicadas.</p>
          ) : (
            <BlogGrid posts={posts} />
          )}

          <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} />
        </div>

        <PanelArchivo posts={todosLosPosts} />
      </div>
    </div>
  )
}
