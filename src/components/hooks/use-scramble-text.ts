import { useEffect, useRef, useState } from 'react'

// Efecto "decodificando": al cambiar el texto, muestra caracteres aleatorios que
// se van asentando de izquierda a derecha hasta revelar el texto final.
export default function useScrambleText(targetText: string) {
  const [displayText, setDisplayText] = useState(targetText)
  const prevRef = useRef(targetText)

  useEffect(() => {
    if (prevRef.current === targetText) return
    prevRef.current = targetText

    const CHARS = '?!#@%ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789'
    const STEPS = 18
    const INTERVAL_MS = 45
    let step = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      step++
      const settled = Math.floor((step / STEPS) * targetText.length)
      setDisplayText(
        targetText
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            if (i < settled) return char
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join('')
      )
      if (step < STEPS) {
        timer = setTimeout(tick, INTERVAL_MS)
      } else {
        setDisplayText(targetText)
      }
    }

    timer = setTimeout(tick, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [targetText])

  return displayText
}
