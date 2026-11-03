import Personajito from '@/svg/components/personajito'

export default function TestPersonajitoPage() {
  return (
    <main className="flex min-h-screen flex-col gap-12 p-8">
      <h1 className="text-2xl">Personajito</h1>

      <h2 className="text-xl">Personajito</h2>
      <section className="flex flex-wrap items-end gap-8">
        <Personajito className="w-[300px]" />
        <Personajito className="w-[150px]" />
        <Personajito className="w-[64px]" />
      </section>

      <section className="flex flex-wrap items-end gap-8">
        <figure className="flex flex-col items-center gap-2">
          <Personajito className="w-[300px]" />
          <figcaption className="text-sm opacity-60">con mancha</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-2">
          <Personajito className="w-[300px]" mancha={false} />
          <figcaption className="text-sm opacity-60">sin mancha</figcaption>
        </figure>
      </section>

      <section className="flex flex-wrap items-end gap-8">
        <figure className="flex flex-col items-center gap-2">
          <Personajito className="w-[150px]" paso={900} amplitud={18} />
          <figcaption className="text-sm opacity-60">rápido</figcaption>
        </figure>
        <figure className="flex flex-col items-center gap-2">
          <Personajito className="w-[150px]" paso={2600} amplitud={8} parpadeo={2000} />
          <figcaption className="text-sm opacity-60">lento</figcaption>
        </figure>
      </section>
    </main>
  )
}
