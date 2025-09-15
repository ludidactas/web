import Textura from '@/components/fx/textura'
import LogoLema from './inicio/logoLema'
import Menu from './inicio/menu'
import Footer from './inicio/footer'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Textura>
      {/* Barra top */}
      <div className="flex dark:bg-[#1e1e1e] justify-between items-center p-2 px-4 mb-12">
        <LogoLema />
        <Menu />
      </div>
      {/* Cajita punteada exterior */}
      <div className="mx-2 lg:mx-10 border-x-4 border-slate-200 border-dashed flex flex-col items-center ">
        {children}
      </div>

      <Footer />
    </Textura>
  )
}
