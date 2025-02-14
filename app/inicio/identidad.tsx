import Pantalla from "./pantalla"
import Image from "next/image"
// @ts-ignore
import Ident, { meta } from "@/app/inicio/identidad.mdx"


export default function Identidad() {
  return <Pantalla one={<Ident />} two={<Imagenes />} title={meta.titulo} btnTxt={""} />
}

const Imagenes = () => <div>
  <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
</div>


