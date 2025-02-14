import Pantalla from "./pantalla"
//@ts-ignore
import ContentCont, {meta} from "@/app/inicio/contacto.mdx"
import Image from "next/image"

export default function Contacto() {
    return <Pantalla one={<ContentCont/>} two={<Imagenes/>} title={meta.titulo} btnTxt={""} espejado/>
  }

  const Imagenes = () => <div>
     <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
    </div>
