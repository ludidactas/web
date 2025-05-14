'use client'
import Image from 'next/image';
import { useState, useEffect } from 'react';

type SvgAnimacionProps = {
  className?: string;
};

export default function SvgAnimacion({ className }: SvgAnimacionProps){
  const [showFirst, setShowFirst] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFirst(prev => !prev);
    }, 300); // Switch every 300ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
       
      {showFirst ? (
        <Image className='m-10 p-10 w-full' src="/img/Caja1.1.svg" alt="Frame 1" width={200} height={200} />
      ) : (
        <Image className='m-10 p-10 w-full' src="/img/Caja2.2.svg" alt="Frame 2" width={200} height={200} />
      )}
    </div>
  );
};

