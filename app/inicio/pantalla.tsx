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
    <div className="flex py-40 flex-col items-center dark:text-white">
        <h2 className={`${Jersey.className} drop-shadow-xl text-6xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text`}>{title}</h2>
        <div className={`flex flex-col md:px-[20%] items-center p-10 gap-10 ${espejado ? "md:flex-row-reverse" : "md:flex-row"}`}>
            <div className="w-2/3" data-aos={ espejado?"fade-left": "fade-right"}>
                {one}
            <div className="text-center mt-6" data-aos="fade-up">    
                {btn}
            </div>    
            </div>

            <div data-aos={ espejado?"fade-right": "fade-left"}>
                {two}
            </div>
        </div>
        <div className="w-10 [animation:bounce_0.5s_infinite]">

        {scroll}
        </div>
      
    </div>

export default Pantalla;