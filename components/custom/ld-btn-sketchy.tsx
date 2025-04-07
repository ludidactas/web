import Link from 'next/link'
import { ComponentProps } from 'react'
import { body } from '../fonts'

export default function BtnSketchy(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={`btn-sketchy w-fit py-2 px-8 ${body.className} ${props.className}`} />
}
