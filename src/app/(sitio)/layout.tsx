import Textura from '@/components/fx/textura'
import Footer from './inicio/footer'
import Topbar from './inicio/topbar'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Textura>
      <Topbar />
      <div className="relative flex flex-col items-center w-full overflow-x-hidden">{children}</div>
      <Footer />
    </Textura>
  )
}
