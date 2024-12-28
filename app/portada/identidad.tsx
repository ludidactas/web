import Pantalla from "./pantalla"
import Image from "next/image"
// @ts-ignore
import ContentId, {meta} from  "@/app/portada/identidad.mdx"

export default function Identidad() {
    return <Pantalla one={<ContentId/>} two={<Imagenes/>} title={meta.titulo} btnTxt={""} />
  }

  const Imagenes = () => <div>
     <Image src="/img/PersonajeIdentidad.png" alt="Personaje1" width={500} height={500}/>

    </div>