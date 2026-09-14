import { redirect } from 'next/navigation'

export default async function SalaPage({ params }: { params: Promise<{ idSala: string }> }) {
  const { idSala } = await params
  redirect(`/salas/${idSala}/encuestas`)
}
