import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { ComponentProps, ComponentType, useId } from 'react'
import { cn } from '@/lib/utils'

/** Cualquier componente de ícono que acepte `className` (los de lucide, o un `<Icon>` de iconify envuelto). */
type IconoSwitch = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

type SwitchChecked = ComponentProps<typeof Switch>['checked']
type SwitchOnCheckedChange = ComponentProps<typeof Switch>['onCheckedChange']

export function SwitchCard({
  checked,
  onCheckedChange,
  title,
  description,
  icono: Icono,
}: {
  title: string
  description: string
  /** Ícono a la izquierda: se tiñe de teal cuando el switch está encendido. */
  icono?: IconoSwitch
  checked: SwitchChecked
  onCheckedChange: SwitchOnCheckedChange
}) {
  const id = useId()
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal" className={cn(Icono && 'items-center')}>
        {Icono && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
              checked ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
            )}
          >
            <Icono className="h-5 w-5" aria-hidden />
          </span>
        )}
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription className="text-xs">{description}</FieldDescription>
        </FieldContent>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </Field>
    </FieldLabel>
  )
}
