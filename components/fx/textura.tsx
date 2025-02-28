"use client"
import React, { PropsWithChildren, createRef, useEffect } from "react"
import p5 from "p5"
import sketch from "./sketch";



// const Textura = ({children}: React.PropsWithChildren) => <div className="bg-textura bg-cover">{children}</div>
const Textura = ({ children }: PropsWithChildren) => {

  const canvasContainer = createRef<HTMLDivElement>();

  useEffect(() => {
    const myp5 = new p5(sketch, canvasContainer.current!)
    return () => {
      myp5.remove();
  }
  }, [])

  return <div>
    <div ref={canvasContainer} className="fixed z-[-1]"></div>
    {children}
  </div>
}

export default Textura