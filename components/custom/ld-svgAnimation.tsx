'use client'
import Image from 'next/image';
import { useState, useEffect } from 'react';

type SvgAnimacionProps = {
  children?: JSX.Element;
};

export default function SvgAnimacion({ children }: SvgAnimacionProps) {
  const [showFirst, setShowFirst] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFirst(prev => !prev);
    }, 300); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full m-20">

      <div className="w-full">
        {showFirst ? (
          <Image
            src="/img/Caja1.1.svg"
            alt="Frame 1"
            width={1000}
            height={1000}
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            src="/img/Caja2.2.svg"
            alt="Frame 2"
            width={1000}
            height={1000}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center m-20">
        {children}
      </div>
    </div>
  );
}
