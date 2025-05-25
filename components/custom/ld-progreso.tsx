import Image from 'next/image'
import LdBarrita from './ld-barrita'

interface Props {
  titulo: string
  score: number
  target: number
  horarios: string
  imagen: string
  scorelabel?: string
  horariosLabel?: string
}

export default function LdProgreso({
  titulo,
  score,
  target,
  horarios,
  imagen,
  scorelabel = 'Inscritos:',
  horariosLabel = 'Horarios:',
}: Props) {
  const porcentaje = score / target
  return (
    <div className="w-full flex flex-h items-center gap-2">
      <Image src={imagen} alt={ titulo } width={64} height={64} />
      <div className="flex flex-col w-full items-start">
        <p>{titulo}</p>
        <LdBarrita porcentaje={porcentaje} />
        <div className="w-full flex items-center justify-between">
          <p className="text-xs">
            {' '}
            {scorelabel} {score} / {target}{' '}
          </p>
          <p className="text-xs">
            {' '}
            {horariosLabel} {horarios}{' '}
          </p>
        </div>
      </div>
      <span className="text-2xl">{(porcentaje * 100).toFixed(0)}%</span>
    </div>
  )
}
