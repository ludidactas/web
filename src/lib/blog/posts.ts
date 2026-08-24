import { glob } from 'fast-glob'
import { join } from 'path'
import type { ComponentType, ReactNode } from 'react'
import { postMetaSchema, type PostMeta } from '@/content/blog/schema'

export interface Post {
  slug: string
  meta: PostMeta
}

export interface PostConContenido extends Post {
  Contenido: ComponentType
}

export interface PostRenderizado extends Post {
  contenido: ReactNode
}

async function listarSlugs(): Promise<string[]> {
  const dir = join(process.cwd(), 'src/content/blog')
  const archivos = await glob('*.mdx', { cwd: dir })
  return archivos.map((archivo) => archivo.replace(/\.mdx$/, ''))
}

export async function obtenerPosts(): Promise<Post[]> {
  const slugs = await listarSlugs()

  const posts: Post[] = []
  for (const slug of slugs) {
    const { meta } = await import(`@/content/blog/${slug}.mdx`)
    const parseInfo = postMetaSchema.safeParse(meta)
    if (!parseInfo.success) {
      console.error(`❌ Frontmatter inválido en blog/${slug}.mdx:`, parseInfo.error.issues)
      continue
    }
    posts.push({ slug, meta: parseInfo.data })
  }

  return posts.sort((a, b) => b.meta.fecha.getTime() - a.meta.fecha.getTime())
}

export interface PostsVecinos {
  anterior: Post | null
  siguiente: Post | null
}

export async function obtenerPostsVecinos(slug: string): Promise<PostsVecinos> {
  const posts = await obtenerPosts()
  const indice = posts.findIndex((post) => post.slug === slug)
  if (indice === -1) return { anterior: null, siguiente: null }
  return { anterior: posts[indice - 1] ?? null, siguiente: posts[indice + 1] ?? null }
}

export async function obtenerPost(slug: string): Promise<PostConContenido | null> {
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`)
    const parseInfo = postMetaSchema.safeParse(mod.meta)
    if (!parseInfo.success) {
      console.error(`❌ Frontmatter inválido en blog/${slug}.mdx:`, parseInfo.error.issues)
      return null
    }
    return { slug, meta: parseInfo.data, Contenido: mod.default }
  } catch {
    return null
  }
}
