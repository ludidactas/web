export default async function Page({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const slug = (await params).id
    const { default: Post, meta } = await import(`@/md/${slug}.mdx`)
    console.log(meta)
   
    return <div className="md">
      <Post />
      </div>
  }
   
  export function generateStaticParams() {
    return [{ slug: 'gaming' }, { slug: 'ilustracion' }, { slug: 'matematica' }, { slug: 'programacion' }]
  }
   
  export const dynamicParams = false