import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './md.css'
import { Inter, Nova_Flat } from 'next/font/google'
import Link from 'next/link'
import { BibliotecaRoot } from '@/components/contenido-provider'

const inter = Inter({ subsets: ['latin'] })

const NovaF = Nova_Flat({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
})

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Tecnologías Educativas Emergente',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Warning: suppressHydrationWarning está porque https://github.com/shadcn-ui/ui/issues/5552
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${NovaF.className} ${inter.className} antialiased`}>
        <BibliotecaRoot>
          <div className="flex justify-between w-full p-4">
            <Link href="/" className="text-2xl">
              Ludidactas
            </Link>
          </div>
          {children}
        </BibliotecaRoot>
      </body>
    </html>
  )
}
