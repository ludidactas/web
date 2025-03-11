import type { Metadata } from 'next'

import './globals.css'
import './md.css'

import { BibliotecaRoot } from '@/components/contenido-provider'
// import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import Menu from './inicio/menu'
import LogoLema from './inicio/logoLema'
import { inter, NovaF } from '@/components/fonts'
import Textura from '@/components/fx/textura'
import Footer from './inicio/footer'

export const metadata: Metadata = {
  title: 'Ludidactas',
  description: 'Tecnologías Educativas Emergentes',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Warning: suppressHydrationWarning está porque https://github.com/shadcn-ui/ui/issues/5552
    <html lang="en">
      <body className={`${NovaF.className} ${inter.className} antialiased`}>
        {/* <GoogleAnalytics gaId="G-VYSMHGH9RZ" /> */}
        {/* <GoogleTagManager gtmId="GTM-M4H5VXKB" /> */}
        <BibliotecaRoot>
          <Textura>
            <div className="flex dark:bg-[#1e1e1e] justify-between items-center p-2 px-4">
              <LogoLema />
              <Menu />
            </div>
            <div className='mx-4 md:mx-10 border-x-4 border-slate-200 border-dashed '>

            {children}
            </div>
            
            <Footer />
          </Textura>
        </BibliotecaRoot>
      </body>
    </html>
  )
}
