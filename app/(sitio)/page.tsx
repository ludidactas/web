import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Laboratorio didáctico-pedagógico.',
  openGraph: {
    title: 'Ludidactas - Edudación emergente',
    description: 'Laboratorio didáctico-pedagógico',
    images: ['https://ludidactas.com/img/Compo.webp'],
  },
}

export default function Home() {
  redirect('/inicio')
}
