import { cn } from '@/lib/utils'

interface DividerProp {
  colorText: string
  top?: boolean
  bottom?: boolean
  classname?: string
  height?: string
}

export default function ShapeDividerWaves({ colorText, top, bottom, classname, height = 'h-[20px] md:h-[90px]' }: DividerProp) {
  if (top) {
    return <div className={cn('shape-divider-waves-bottom w-full', height, colorText, classname)} />
  }

  if (bottom) {
    return <div className={cn('shape-divider-waves w-full', height, colorText, classname)} />
  }
  return (
    <>
      <div className={cn('shape-divider-waves-bottom w-full', height, colorText, classname)} />
      <div className={cn('shape-divider-waves w-full', height, colorText, classname)} />
    </>
  )
}
