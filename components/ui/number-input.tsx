import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  value: number | null
  onChange: (value: number | null) => void
  nullDisplay: React.ReactNode
  min?: number
  max?: number
  className?: string
}

export function NumberInput({ value, onChange, nullDisplay, min = 1, max = 99, className }: NumberInputProps) {
  const decrement = () => {
    if (value === null) return
    if (value <= min) onChange(null)
    else onChange(value - 1)
  }

  const increment = () => {
    if (value === null) onChange(min)
    else if (value < max) onChange(value + 1)
  }

  return (
    <div className={cn('flex items-center rounded-md border border-input bg-white overflow-hidden', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none shrink-0 flex justify-center items-center text-xs"
        onClick={decrement}
        disabled={value === null}
      >
        <Minus size={12} strokeWidth={5} />
      </Button>

      <div className="w-6 text-center font-medium tabular-nums select-none text-xs">
        {value === null ? nullDisplay : value}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none shrink-0 flex justify-center items-center text-xs"
        onClick={increment}
        disabled={value !== null && value >= max}
      >
        <Plus size={12} strokeWidth={5} />
      </Button>
    </div>
  )
}
