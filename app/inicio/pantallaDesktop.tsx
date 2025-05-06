import { titulo } from '@/components/fonts'
import { PantallaProps } from './pantalla'
import Image from 'next/image'

const PantallaDesktop = ({ title, one, two, btn, scroll, espejado = false }: PantallaProps) => (
  <div className="hidden lg:flex w-[100vw] h-[100vh] mt-5 mb-20 flex-col items-center place-content-center">
    <h2
      className={`${titulo.className} mb-8 text-6xl bg-gradient-to-r from-cyan-500 to-blue-500 drop-shadow-[2px_2px_2px_rgba(0,0,0)]
 text-transparent bg-clip-text`}
    >
      {title}
    </h2>

  
    <div className={`flex px-40 items-center mx-10 gap-20 ${espejado ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
    <div
  className="relative w-full h-fit text-xl text-center bg-white/60 overflow-hidden px-8 pt-10 pb-8"
  // style={{
  //   backgroundImage: 'url("/img/Caja.gif")',
  //   backgroundRepeat: 'no-repeat',
  //   backgroundSize: "auto",
  //   backgroundPosition: 'center',
  // }}
    data-aos={espejado ? 'fade-left' : 'fade-right'}
>
  {/* Background image behind the content */}
  <Image
    src="/img/Caja.gif"
    alt=""
    className="absolute w-fit inset-0 z-0"
    width={400}
    height={400}
  />

  {/* Foreground content */}
  <div className="relative z-10">
    <div>{one}</div>
    <div className="text-center mt-6" data-aos="fade-up">
      {btn}
    </div>
  </div>

  </div>

      <div className="w-[50vw]" data-aos={espejado ? 'fade-right' : 'fade-left'}>
        {two}
      </div>
    </div>
    <div className="w-10 m-10 mb-10">
      {scroll}
    </div>
  </div>
)

export default PantallaDesktop
