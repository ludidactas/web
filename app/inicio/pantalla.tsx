import SvgAnimacion from '@/components/custom/ld-svgAnimation';
import { titulo } from '@/components/fonts'



export interface PantallaProps {
  title: string,
  one: JSX.Element,
  two: JSX.Element,
  btn: JSX.Element,
  scroll: JSX.Element,
  espejado?: boolean,
}

const Pantalla = ({ title, one, two, btn, scroll, espejado = false }: PantallaProps) => {
  return (
    <div className="w-[100vw] h-[100vh] flex-col items-center place-content-center">

      {/* DESKTOP */}
      <div className="hidden lg:flex flex-col items-center mt-5 mb-20">
        <h2
          className={`${titulo.className} mb-8 text-6xl bg-gradient-to-r from-cyan-500 to-blue-500 drop-shadow-[2px_2px_2px_rgba(0,0,0)] text-transparent bg-clip-text`}
        >
          {title}
        </h2>

        <div className={`flex px-40 items-center mx-10 gap-20 ${espejado ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>

          <div
            className="relative w-full text-xl text-center bg-white/60 px-8 pt-10 pb-8"
            data-aos={espejado ? 'fade-left' : 'fade-right'}
          >
            <SvgAnimacion>
              <div>
                {one}
              <div className="text-center mt-6" data-aos="fade-up">
                {btn}
              </div>
              </div>
            </SvgAnimacion>
            </div>

            <div className="w-[50vw]" data-aos={espejado ? 'fade-right' : 'fade-left'}>
              {two}
            </div>
          </div>

          <div className="w-10 m-10 mb-10">{scroll}</div>
        </div>

        {/* MOBILE */}
        <div className="my-10 py-10 flex lg:hidden flex-col place-content-center items-center w-full h-full">
          <div className="flex flex-col mx-8 items-center text-[0.5em] text-center bg-white rounded-xl border-2 border-dashed border-slate-800 p-4">
            <h2
              data-aos="fade-down"
              className={`${titulo.className} text-4xl drop-shadow-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text`}
            >
              {title}
            </h2>

            <div className="w-[30vw] m-4" data-aos="fade-left">
              {two}
            </div>

            <div className="text-[1.5em] p-4" data-aos="fade-right">
              {one}
            </div>

            <div className="text-[1.5em] text-center" data-aos="fade-up">
              {btn}
            </div>
          </div>

          <div className="w-[8vw] m-10 mb-10 bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4]">
            {scroll}
          </div>
        </div>
      </div>
     
      );
    }
      export default Pantalla;


