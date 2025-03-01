import Pantalla from './pantalla'
import Image from 'next/image'
//@ts-ignore meta
import Ident, { meta } from '@/app/inicio/identidad.mdx'
import Link from 'next/link'

export default function Identidad() {
  return (
    <div>
      <Pantalla
        one={<Ident />}
        two={<Imagenes />}
        title={meta.titulo}
        btn={
          <Link className="custom-btn btn-15" href="/identidad">
            {' '}
            ¡Quiero saber más!{' '}
          </Link>
        }
      />
    </div>
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoIdentidad.png" alt="Personaje1" width={500} height={500} />
  </div>
)
