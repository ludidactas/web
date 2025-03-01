'use client'
import { PropsWithChildren } from 'react'
import dynamic from 'next/dynamic'

// Desactivamos ssr
const WithAOSClient = dynamic(() => import('./with-aos').then((mod) => mod.default), { ssr: false })

// Usar este y no directamente el otro desde server components
export default function WithAOS({ children }: PropsWithChildren) {
  return <WithAOSClient>{children}</WithAOSClient>
}
