'use client'

import { useSession } from 'next-auth/react'
import { createContext, useContext, useState } from 'react'

export default function useEncuestaEstudianteLoginState() {
  const [nombreSala, setNombreSala] = useState<string>()
  const [nombre, setNombre] = useState<string | undefined>(undefined)
  const [dni, setDNI] = useState<string | undefined>(undefined)
  const [ingresado, setIngresado] = useState(false)

  // Usamos el nombre de la sesión si está autenticado con google, sino el que nos de
  const { data: nextSession, status } = useSession()
  const nombreFinal = status === 'authenticated' ? (nextSession?.user?.name || 'Usuario') : nombre

  return { nombre: nombreFinal, setNombre, dni, setDNI, ingresado, setIngresado, nombreSala, setNombreSala }
}

// Context
const EncuestaEstudianteLoginContext = createContext<ReturnType<typeof useEncuestaEstudianteLoginState> | undefined>(undefined)

// Provider - El auth viene del server
export const EncuestaEstudianteLoginProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <EncuestaEstudianteLoginContext.Provider value={useEncuestaEstudianteLoginState()}>{children}</EncuestaEstudianteLoginContext.Provider>
}

/** Provee el context de login de estudiante: state para nombre, dni, y `ingresado` === true si ya le dió al botón de ingresar */
export const useEncuestaEstudianteLogin = () => {
  const context = useContext(EncuestaEstudianteLoginContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaEstudianteLogin fuera del EncuestaEstudianteLoginProvider')
  }
  return context
}
