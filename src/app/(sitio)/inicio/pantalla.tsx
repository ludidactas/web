import { titulo } from '@/components/fonts'
import ShapeDividerWaves from '../custom/shape-divider'


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
      <ShapeDividerWaves bottom colorText={'text-white'} />

      <div className={`w-screen max-h-screen flex-col items-center place-content-center mt-10 ${classname}`}>
        {/* DESKTOP */}
        <div className="hidden lg:flex flex-col items-center">
          <h2 className={`mb-12`}>
            {title}
          </h2>

          <div className={`flex items-center gap-20 ${espejado ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
            <div
              className=" flex flex-col w-fit gap-8 text-left p-10 rounded-xl"
              data-aos={espejado ? 'fade-left' : 'fade-right'}
            >
              {one}
              <div className='self-center'>
                {btn}
              </div>
            </div>

            <div className="w-[25vw]" data-aos={espejado ? 'fade-right' : 'fade-left'}>
              {two}
            </div>
          </div>

          <div className="mt-10 text-center">{scroll}</div>
        </div>
      </div>


      {/* MOBILE */}
      <div className="flex flex-col lg:hidden items-center w-full h-full ">
        <div className="flex flex-col mx-8 items-center text-[0.5em] text-center p-4">

          {title}

          <div className="w-[35vw] my-6" data-aos="fade-left">
            {two}
          </div>

          <div
            className="w-full flex flex-col p-4 gap-4 rounded-xl bg-white/50"
            data-aos={espejado ? 'fade-left' : 'fade-right'}
          >
            {one}
            <div className='flex justify-center'>
              {btn}
            </div>
          </div>
        </div>

        <div className="flex justify-center w-40 md:m-10 mb-10">{scroll}</div>
      </div>


      {/* Shape divider bottom */}
      <ShapeDividerWaves top colorText={'text-white'} />

    </>
  )
}
export default Pantalla
