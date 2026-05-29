import ClasesSVG from '@/svg/dist/banners/bannerclases.svg'
import { LdSvg } from './ld-svg'
import BtnNew from '@/svg/dist/ui/btnNuevoSVGO.svg'
import { secuenciar } from '@/lib/animaciones'

export default function BannerClases({ className }: { className?: string }) {
  const mensaje = <h1 className="text-2xl text-black">Inscribite!</h1>
  const btn = (
    <LdSvg
      SvgComponent={BtnNew}
      ids={['btnuno', 'btndos', 'btntres', 'slot'] as const}
      animation={secuenciar(['btnuno', 'btndos', 'btntres'], 1000)}
      slots={{ slot: mensaje } as const}
    />
  )

  return (
    <LdSvg
      SvgComponent={ClasesSVG}
      ids={['personajes', 'mano', 'info', 'fondo', 'slot'] as const}
      slots={
        {
          slot: btn,
        } as const
      }
      animation={(nodos, t) => {
        ;['personajes', 'mano', 'info', 'slot'].forEach((id, idx) => {
          const nodo = (nodos as any)[id]
          nodo.dy(Math.sin(t / 600 + idx) * 0.09)
        })
      }}
      className={`w-4/5 ${className ?? ''}`}
    />
  )
}
