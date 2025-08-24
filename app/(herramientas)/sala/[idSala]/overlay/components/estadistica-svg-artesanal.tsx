'use client'
import { Encuesta } from "@/polls/encuestas";
import { SVG } from "@svgdotjs/svg.js";
import { useEffect, useRef } from "react";
interface EstadisticaSvgProps {
  data: Encuesta[]
}
export default function EstadisticaSvg({ data }: EstadisticaSvgProps) {
  // const SVGContainer = useMemo(() => SVG(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (containerRef.current) {
      const svg = SVG().addTo(containerRef.current).size('100%', '100%');
      svg.viewbox(0, 0, 100, 100); 

    }
  }, [containerRef]);
  return (
    <div ref={containerRef}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <g className="flex flex-col gap-48">
          {data.map((encuesta) => (
            <g key={encuesta.pregunta} className="flex flex-col gap-24">
              {encuesta.opciones.map((opcion, idxOpc) => (
                <BarraEstadistica opcion={opcion} idx={idxOpc} key={opcion.id} />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
function BarraEstadistica({ opcion, idx }: { opcion: Encuesta['opciones'][number]; idx: number }) {
  useEffect(() => {
    // Animar el ancho de los rects según los votos y el total
  }, [opcion.votos])
  return (
    <rect x={idx * 10} y={100 - opcion.votos * 10} width="8" height="8" fill={`hsl(${(idx * 36) % 360}, 100%, 50%)`} />
  )
}