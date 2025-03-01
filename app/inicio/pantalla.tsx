interface PantallaProps {
    espejado?: boolean,
    title: string,
    one: JSX.Element,
    two: JSX.Element,
    btn: JSX.Element,
}

const Pantalla = ({ title, one, two, btn, espejado = false }: PantallaProps) =>
    <div className="flex py-[100px] flex-col items-center border-2 dark:text-white">
        <h2 className="text-5xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">{title}</h2>
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
      
    </div>

export default Pantalla;