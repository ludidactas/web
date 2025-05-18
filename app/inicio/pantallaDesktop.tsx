import { titulo } from '@/components/fonts'
import { PantallaProps } from './pantalla'

const PantallaDesktop = ({ title, one, two, btn, scroll, espejado = false }: PantallaProps) => (
  <div className="hidden lg:flex w-[100vw] h-[100vh] mt-5 mb-20 flex-col items-center place-content-center">
    <h2
      className={`${titulo.className} text-7xl bg-gradient-to-r from-cyan-500 to-blue-500 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0)]
 text-transparent bg-clip-text`}
    >
      {title}
    </h2>

    <div className={`flex px-[200px] items-center p-10 gap-20 ${espejado ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      <div
        className="w-[50vw] gap-4  bg-white/60 rounded-xl border-4 border-dashed border-slate-800 p-8 text-xl text-center"
        data-aos={espejado ? 'fade-left' : 'fade-right'}
      >
        {one}
        <div className="text-center mt-6" data-aos="fade-up">
          {btn}
        </div>
      </div>

      <div className="w-[25vw]" data-aos={espejado ? 'fade-right' : 'fade-left'}>
        {two}
      </div>
    </div>
    <div className="w-10 m-10 mb-10">
      {scroll}
    </div>
  </div>
)

export default PantallaDesktop
