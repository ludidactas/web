'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { TabsTriggerLink } from './tabs-trigger-link'

const TABS = [
  { valor: 'encuestas', etiqueta: 'Encuestas' },
  { valor: 'go', etiqueta: 'Go' },
] as const

/** Navegación mobile entre Encuestas y Go de la sala del estudiante, con el mismo aspecto que las tabs
 * del profe. En desktop esa navegación es `SalaFloatingNav`. */
export function TabsSalaEstudiante({
  idSala,
  actual,
  className,
}: {
  idSala: string
  actual: (typeof TABS)[number]['valor']
  className?: string
}) {
  return (
    <Tabs value={actual} className={cn('md:hidden', className)}>
      <TabsList className="rounded-none w-full bg-ld-violeta text-white">
        {TABS.map(({ valor, etiqueta }) =>
          valor === actual ? (
            <TabsTrigger key={valor} className="text-xs flex-1" value={valor}>
              {etiqueta}
            </TabsTrigger>
          ) : (
            <TabsTriggerLink key={valor} href={`/sala/${idSala}/${valor}`}>
              {etiqueta}
            </TabsTriggerLink>
          )
        )}
      </TabsList>
    </Tabs>
  )
}
