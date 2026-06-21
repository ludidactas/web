import { Outlined } from "../fx/filtros";

export const Title = ({ radius, text, color, size, className }: { radius?: number, text: string; color: string; size: string, className?: string }) => (
  <div className='drop-shadow-[2px_2px_2px_rgba(0,0,0)] md:text-7xl h-10 md:h-20 '>
    <Outlined radius= {radius} outlineColor="white" className={`${color} ${size} ${className} tracking-wide`}>
      {text}
    </Outlined>
  </div>
)