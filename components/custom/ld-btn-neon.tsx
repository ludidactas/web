import Link from 'next/link'
import { ComponentProps } from 'react'

export default function BtnNeon(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={`custom-btn btn-15 w-fit ${props.className}`} />
}
