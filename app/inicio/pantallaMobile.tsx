import { titulo } from '@/components/fonts'
import { PantallaProps } from './pantalla'

const PantallaMobile = ({ title, one, two, btn, scroll }: PantallaProps) => (
  <div className="my-10 py-10 flex lg:hidden w-[100vw] h-[100vh] flex-col place-content-center items-center">
    <div
      className="flex flex-col mx-8 items-center text-[0.5em] text-center bg-white rounded-xl border-2 border-dashed border-slate-800 p-4"
      data-aos=""
    >
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
)

export default PantallaMobile
