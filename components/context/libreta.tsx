import { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useState } from 'react'

interface ILibretaContext {
  libreta: Record<string, boolean>
  setLibreta: Dispatch<SetStateAction<Record<string, boolean>>>
}

const LibretaContext = createContext<ILibretaContext>({
  libreta: {},
  setLibreta: () => {},
})

export const LibretaProvider = ({ children }: PropsWithChildren) => {
  // Value para el contexto
  const [libreta, setLibreta] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const guardado = localStorage.getItem('libreta')
    if (guardado) setLibreta(JSON.parse(guardado))
  }, [])

  useEffect(() => {
    localStorage.setItem('libreta', JSON.stringify(libreta))
  }, [libreta])

  return <LibretaContext.Provider value={{ libreta, setLibreta }}>{children}</LibretaContext.Provider>
}

export default LibretaContext
