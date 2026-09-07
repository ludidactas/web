'use client'

import { useEffect } from 'react'

import { avisarConectado } from '@/lib/google/conexion'

export default function DriveConectado() {
  useEffect(avisarConectado, [])

  return <p className="p-8 text-center text-slate-500">Ya podés cerrar esta ventana.</p>
}
