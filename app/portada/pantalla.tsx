interface PantallaProps {
    espejado?: boolean,
    title: string,
    one: JSX.Element,
    two: JSX.Element,
    btnTxt: string,
}

const Pantalla = ({ title, one, two, btnTxt, espejado=false }: PantallaProps) =>
    <div className="flex pt-[100px] flex-col items-center dark:text-white">
        <h2 className="text-5xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">{title}</h2>
        <div className={`flex flex-col md:px-[200px] items-center p-20 gap-10 ${espejado?"md:flex-row-reverse": "md:flex-row"}`}>
            <div className="w-2/3">
                {one}
            </div>

            <div className="">
                {two}
            </div>
            {btnTxt}
        </div>
    </div>

export default Pantalla;