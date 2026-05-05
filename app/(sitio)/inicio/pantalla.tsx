// import { LdSvg } from '@/components/custom/ld-svg'
import { titulo } from '@/components/fonts'
import { cn } from '@/lib/utils'
// import { secuenciar } from '@/lib/utils';
// import CajaTexto from '@/svg/CajaPrueba3SVGO.svg'

export interface PantallaProps {
  title?: React.ReactNode
  one: JSX.Element
  two: JSX.Element
  btn: JSX.Element
  scroll: JSX.Element
  espejado?: boolean
  classname?: string
}

const Pantalla = ({ title, one, two, btn, scroll, espejado = false, classname }: PantallaProps) => {
  return (
    <>
      {/* Shape divider top */}
      <div className={cn('shape-divider-waves h-[90px] w-full text-white')} />

      <div className={`w-[100vw] min-h-[100vh] flex-col items-center place-content-center mb-20 ${classname}`}>
        {/* DESKTOP */}
        <div className="hidden lg:flex flex-col items-center my-10 ">
          <h2 className={`${titulo.className} text-7xl mb-20 drop-shadow-[4px_4px_2px_rgba(20,20,20)]`}>{title}</h2>

          <div className={`flex items-center gap-20 ${espejado ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
            <div
              className=" flex flex-col w-fit gap-8 text-left p-10 rounded-xl"
              data-aos={espejado ? 'fade-left' : 'fade-right'}
            >
              {one}
              {btn}
            </div>

            <div className="w-[25vw]" data-aos={espejado ? 'fade-right' : 'fade-left'}>
              {two}
            </div>
          </div>

          <div className="mt-10 text-center">{scroll}</div>
        </div>

        {/* MOBILE */}

        <div className="flex lg:hidden flex-col place-content-center items-center w-full h-full my-20 pb-10">
          <div className="flex flex-col mx-8 items-center text-[0.5em] text-center p-4">
            <h2
              data-aos="fade-down"
              className={`${titulo.className} text-4xl drop-shadow-[2px_2px_2px_rgba(0,0,0)] bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text`}
            >
              {title}
            </h2>

            <div className="w-[35vw] m-4" data-aos="fade-left">
              {two}
            </div>

            <div
              className="w-full flex flex-col p-2 gap-4 rounded-xl bg-white/50"
              data-aos={espejado ? 'fade-left' : 'fade-right'}
            >
              {one}
              {btn}
            </div>
          </div>

          <div className="flex justify-center w-40 md:m-10 mb-10">{scroll}</div>
        </div>
      </div>

      {/* Shape divider bottom */}
      <div className={cn('shape-divider-waves-bottom h-[90px] w-full text-white')} />
    </>
  )
}
export default Pantalla
