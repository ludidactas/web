import { Jersey } from "@/components/fonts";

interface PantallaProps {
    espejado?: boolean,
    title: string,
    one: JSX.Element,
    two: JSX.Element,
    btn: JSX.Element,
    scroll:JSX.Element,
}

const Pantalla = ({ title, one, two, btn, scroll, espejado = false }: PantallaProps) =>
    <div className="flex py-[2em] flex-col items-center dark:text-white">
        <h2 className={`${Jersey.className} drop-shadow-xl text-6xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text`}>{title}</h2>
        <div className={`flex px-60 items-center p-10 gap-10 ${espejado ? "md:flex-row-reverse" : "md:flex-row"}`}>
            <div className="w-2/3 bg-white/60 rounded-xl border-4 border-dashed border-slate-800 p-4" data-aos={ espejado?"fade-left": "fade-right"}>
                {one}
            <div className="text-center mt-6" data-aos="fade-up">    
                {btn}
            </div>    
            </div>

            <div className=""data-aos={ espejado?"fade-right": "fade-left"}>
                {two}
            </div>
        </div>
        <div className="w-10 mb-40 bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4]" >

        {scroll}
        </div>
      
    </div>

export default Pantalla;