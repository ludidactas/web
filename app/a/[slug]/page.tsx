import { getArticulo } from "@/md";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug

  // Si tenemos a este artículo listado, traemos su MD
  const [Componente, meta] = getArticulo(slug)

  return <>
  {/* Si hay componente lo rendereamos */}
  {Componente && <Componente />}

  {/* Si no, mostramos un mensaje */}
  {!Componente && <p className="p-8">
    No tenemos indexado el componente `{slug}`. O bien falta el MD en la carpeta `md`, o bien falta indexarlo en `app/a/[slug]/page.tsx`
    </p>}
  </>;
}
