import { Jersey } from "@/components/fonts";

interface PantallaMobProps {
    espejado?: boolean,
    title: string,
    one: JSX.Element,
    two: JSX.Element,
    btn: JSX.Element,
    scroll: JSX.Element,
}

const PantallaMobile = ({ title, one, two, btn, scroll }: PantallaMobProps) =>
    <div className="flex mt-40 mb-10 flex-col items-center dark:text-white">

        <div className="flex flex-col mx-10 items-center text-[0.5em] text-center bg-white/60 rounded-xl border-2 border-dashed border-slate-800 p-4" data-aos="">
            <h2 data-aos='fade-down' className={`${Jersey.className} drop-shadow-xl text-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text`}>{title}</h2>

            <div className="w-20" data-aos="fade-left">
                {two}
            </div>
    <div data-aos="fade-right">
            {one}

    </div>

            <div className="text-center text-[0.8em]" data-aos="fade-up">
                {btn}
            </div>
        </div>


        <div className="w-4 m-10 mb-10 bg-white/50 rounded-full [animation:bounce_0.8s_infinite] hover:text-white hover:bg-[#06b6d4]" >

            {scroll}
        </div>


    </div>



export default PantallaMobile;


