import Link from 'next/link'
import { ComponentProps } from 'react'
import { boton } from '../fonts'

export default function BtnNeon(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={`custom-btn btn-15 w-fit py-2 px-8 ${boton.className} ${props.className}`} />
}
