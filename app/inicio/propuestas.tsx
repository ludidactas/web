import Pantalla from './pantalla'
//@ts-ignore meta
import ContentProp, { meta } from '@/app/inicio/propuestas.mdx'
import Image from 'next/image'
import Link from 'next/link'

export default function Propuestas() {
  return (
    <Pantalla
      one={<ContentProp />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <Link className="custom-btn btn-15" href="/propuestas">
          {' '}
          ¡Conoce nuestras propuestas!{' '}
        </Link>
      }
      espejado
    />
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoPropuestas.png" alt="Personaje2" width={500} height={500} />
  </div>
)
