import { cn } from "@/lib/utils";
import { Outlined } from "../fx/filtros";

export const Title = ({ radius, text, color, size, className }: { radius?: number, text: string; color: string; size: string, className?: string }) => (
  <div className={cn('drop-shadow-[2px_2px_2px_rgba(0,0,0)] md:text-7xl', className)}>
    <Outlined radius= {radius} outlineColor="white" className={cn(color, size, 'tracking-wide')}>
      {text}
    </Outlined>
  </div>
)