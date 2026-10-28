'use client'
import SvgPersonajito from '@/svg/dist/ui/personajito.svg'
import { Pendulo, PersonajeCaminante, PersonajeCaminanteProps } from './personaje-caminante'

/** Los pies van en contrafase, y la mano acompaña al pie contrario, como cuando uno camina */
const PENDULOS: Pendulo[] = [
  { id: 'pie1', fase: 0, escala: 1, pierna: true },
  { id: 'pie11', fase: 1, escala: 1, pierna: true },
  { id: 'Manolibro', fase: 1, escala: 0.6 },
]

const OJOS = { abiertos: 'Ojos1', cerrados: 'Ojos2' }

export default function Personajito(props: PersonajeCaminanteProps) {
  return <PersonajeCaminante SvgComponent={SvgPersonajito} pendulos={PENDULOS} ojos={OJOS} {...props} />
}
