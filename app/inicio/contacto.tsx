import Pantalla from "./pantalla"
import ContentCont, {meta} from "@/app/inicio/contacto.mdx"
import Image from "next/image"
import Link from "next/link"

export default function Contacto() {
    return <Pantalla one={<ContentCont/>} two={<Imagenes/>} title={meta.titulo} btn={<Link className="custom-btn btn-15" href="/contacto"> ¡Contáctanos! </Link>} espejado/>
  }

  const Imagenes = () => <div>
     <Image src="/img/PersoContacto.png" alt="Personaje4" width={500} height={500} />
    </div>
