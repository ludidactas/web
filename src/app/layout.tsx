import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'

import type { Metadata } from 'next'

import './globals.css'

import { body } from '@/components/fonts'
import { FiltrosSvg } from '@/components/fx/filtros'

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Tecnologías Educativas Emergentes',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${body.className} antialiased`}>
        <GoogleTagManager gtmId="GTM-M4H5VXKB" />
        <VercelAnalytics />
        <FiltrosSvg />
        {children}
      </body>
    </html>
  )
}
