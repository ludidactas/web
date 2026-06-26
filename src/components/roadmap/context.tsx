import { usePrevious } from '@uidotdev/usehooks'
import { createContext, PropsWithChildren, useRef, useState } from 'react'

const useRoadmapState = () => {
  const [clicked, setClicked] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const lastFocused = usePrevious(focused)
  const svgRef = useRef<SVGAElement>()

  return { clicked, setClicked, focused, setFocused, lastFocused, svgRef }
}

const ContextoSvgRoadmap = createContext<ReturnType<typeof useRoadmapState>>({
  clicked: null,
  setClicked: () => {},
  focused: null,
  setFocused: () => {},
  lastFocused: null,
  svgRef: { current: undefined },
})

/**
 * Hostea el estado del roadmap (nodo clickeado, hovereado, etc...)
 */
export const SvgRoadmapProvider = ({ children }: PropsWithChildren) => {
  return <ContextoSvgRoadmap.Provider value={useRoadmapState()}>{children}</ContextoSvgRoadmap.Provider>
}

export default ContextoSvgRoadmap
