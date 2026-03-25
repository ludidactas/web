import { cn } from '@/lib/utils'

interface DividerProp {
  colorText: string
  top?: boolean
  bottom?: boolean
  classname?: string
}

export default function ShapeDividerWaves({ colorText, top, bottom, classname }: DividerProp) {
  if (top) {
    return <div className={cn('shape-divider-waves-bottom h-[90px] w-full', colorText)} />
  }

  if (bottom) {
    return <div className={cn('shape-divider-waves h-[90px] w-full', colorText)} />
  }
  return (
    <>
      {/* Shape divider bottom */}
      <div className={cn('shape-divider-waves-bottom h-[90px] w-full', colorText, classname)} />

      {/* Shape divider top */}
      <div className={cn('shape-divider-waves h-[90px] w-full', colorText, classname)} />
    </>
  )
}
