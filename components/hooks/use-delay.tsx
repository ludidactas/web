import { useEffect, useState } from 'react'

export default function useConfirmarConDelay<T>(generador: () => T, delat: number) {
  const valor = generador()
  const [confirmado, setConfirmado] = useState<T>()

  useEffect(() => {
    if (valor) {
      // If it looks empty, start a timer
      const timer = setTimeout(() => {
        setConfirmado(valor)
      }, 1000)
      // Cleanup: if data arrives before 2s, this cancels the timer
      return () => clearTimeout(timer)
    } else {
      // If data arrives, reset immediately to false
      setConfirmado(undefined)
    }
  }, [valor])

  return { valor, confirmado }
}
