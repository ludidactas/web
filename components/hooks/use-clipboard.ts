import { useState } from "react"
import { useCopyToClipboard } from "usehooks-ts"

export default function useClipboard() { 
  const [_copiedText, copy] = useCopyToClipboard()
  const [justCopied, setJustCopied] = useState(false)

  const handleCopy = (text: string) => () => {  
    copy(text)
      .then(() => {
        setJustCopied(true)

        setTimeout(() => {
          setJustCopied(false)
        }, 3000)
      })
      .catch((error: unknown) => {
        console.error('Failed to copy!', error)
      })
  }

  return { justCopied, handleCopy }
}