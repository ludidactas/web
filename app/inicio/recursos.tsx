import Pantalla from './pantalla'
import Image from 'next/image'
// @ts-ignore
import Recur, {meta} from '@/app/inicio/recursos.mdx'

export default function Recursos() {
  return <Pantalla one={<Recur/>} two={<Imagenes/>} title={meta.titulo} btnTxt={''} />
}

const Imagenes = () => <div>
  <Image src="/img/PersoRecursos.png" alt="Personaje3" width={500} height={500}/>
  </div>
