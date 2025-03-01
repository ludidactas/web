'use client'
import { PropsWithChildren, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function WithAOS({ children }: PropsWithChildren) {
  useEffect(() => {
    if (typeof window !== 'undefined') AOS.init()
  }, [])

  return children
}
