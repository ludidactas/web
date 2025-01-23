'use client'

import { importarBiblioteca } from '@/lib/importMdx'
import { createContext, ReactNode, use } from 'react'

type TBiblioteca = Awaited<ReturnType<typeof importarBiblioteca>>

const BibliotecaContext = createContext<TBiblioteca | null>(null)

export function BibliotecaProvider({ children, biblioteca }: { children: ReactNode; biblioteca: TBiblioteca }) {
  return <BibliotecaContext.Provider value={biblioteca}>{children}</BibliotecaContext.Provider>
}

/**
 * Usa y devuelve el value de context
 */
export function useBiblioteca() {
  const context = use(BibliotecaContext)
  if (!context) {
    throw new Error('useMDX necesita BibliotecaProvider')
  }

  /** Devuelve una materia por id de entre todas las que existen */
  const getMateria = (id: string) => context.materias.find((m) => m.meta.id == id)

  /** Devuelve una unidad por id de entre todas las que existen */
  const getUnidad = (id: string) => context.unidades.find((u) => u.meta.id == id)

  return { ...context, getMateria, getUnidad }
}
