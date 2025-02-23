import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import './md.css'
import { Inter, Nova_Flat } from 'next/font/google'
import Link from 'next/link'
import Menu from './inicio/menu'
import LogoLema from './inicio/logoLema'

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
        <div className="flex dark:bg-[#1e1e1e] justify-between p-2 px-4">
          <LogoLema/>
          <Menu/>
          {/* <Link href="/" className="text-2xl">
            Ludidactas
          </Link>
          <Link href="/inicio" className="text-2xl">
            Portada
          </Link> */}
        </div>
        {children}
      </body>
    </html>
  )
}
