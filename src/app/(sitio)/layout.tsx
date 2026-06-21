import Textura from '@/components/fx/textura'
import Footer from './inicio/footer'
import Topbar from './inicio/topbar'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Textura>
      <Topbar />
      {/* Contenido pantallas de inicio */}
      <div className="flex flex-col items-center ">{children}</div>
      <Footer />
    </Textura>
  )
}
