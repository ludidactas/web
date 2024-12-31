import Pantalla from './pantalla'
// @ts-expect-error meta no exportado correctamente
import ContentProp, { meta } from '@/app/portada/propuestas.mdx'
import Image from 'next/image'

export default function Propuestas() {
  return <Pantalla one={<ContentProp />} two={<Imagenes />} title={meta.titulo} btnTxt={''} espejado />
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.png" alt="Personaje2" width={500} height={500} />
  </div>
)
