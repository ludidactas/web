import Pantalla from './pantalla'
import Image from 'next/image'
//@ts-ignore meta
import Recur, { meta } from '@/app/inicio/recursos.mdx'
import Link from 'next/link'

export default function Recursos() {
  return (
    <Pantalla
      one={<Recur />}
      two={<Imagenes />}
      title={meta.titulo}
      btn={
        <Link className="custom-btn btn-15" href="/roadmap">
          {' '}
          Explorar recursos{' '}
        </Link>
      }
    />
  )
}

const Imagenes = () => (
  <div>
    <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500} />
  </div>
)
