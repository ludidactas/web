export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Si tenemos a este artículo listado, traemos su MD
  // const { Contenido } = getMateria(slug)
  const Contenido = null

  return (
    <>
      {/* Si hay componente lo rendereamos */}
      {Contenido && <div className="md p-8">{/* <Contenido /> */}</div>}

      {/* Si no, mostramos un mensaje */}
      {!Contenido && (
        <p className="p-8">
          No tenemos indexado el componente `{slug}`. O bien falta el MD en la carpeta `md`, o bien falta indexarlo en
          `app/a/[slug]/page.tsx`
        </p>
      )}
    </>
  )
}
