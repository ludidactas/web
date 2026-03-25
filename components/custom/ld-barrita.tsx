import ProgressBar from '@/svg/dist/progressbar.svg'
import { LdSvg } from './ld-svg'

export default function LdBarrita({ porcentaje }: { porcentaje: number }) {
  return (
    <LdSvg
      SvgComponent={ProgressBar}
      ids={['Caja', 'Carga'] as const}
      setup={(nodos) => {
        const dx = (1 - porcentaje) * 720
        nodos['Carga'].dx(-dx)
      }}
    />
  )
}
