import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { ComponentProps, useId } from 'react'

type SwitchChecked = ComponentProps<typeof Switch>['checked']
type SwitchOnCheckedChange = ComponentProps<typeof Switch>['onCheckedChange']

export function SwitchCard({
  checked,
  onCheckedChange,
  title,
  description,
}: {
  title: string
  description: string
  checked: SwitchChecked
  onCheckedChange: SwitchOnCheckedChange
}) {
  const id = useId()
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription className="text-xs">{description}</FieldDescription>
        </FieldContent>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </Field>
    </FieldLabel>
  )
}
