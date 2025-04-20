import Link from 'next/link'
import { ComponentProps } from 'react'
import { body } from '../fonts'

export default function BtnSketchy(props: ComponentProps<typeof Link> & { disabled?: boolean }) {
  return (
    <Link
      {...props}
      className={`w-fit py-2 px-8 flex-0 ${body.className} ${props.className} ${
        props.disabled ? 'btn-disabled text-slate-600' : 'btn-sketchy'
      }`}
    />
  )
}
