import PantallaDesktop from "./pantallaDesktop";
import PantallaMobile from "./pantallaMobile";

export interface PantallaProps {
    title: string,
    one: JSX.Element,
    two: JSX.Element,
    btn: JSX.Element,
    scroll: JSX.Element,
    espejado?: boolean,
}

export default function Pantalla(props: PantallaProps){
    return (<>
        <PantallaDesktop {...props} />
        <PantallaMobile {...props} />
        </>
    )
}