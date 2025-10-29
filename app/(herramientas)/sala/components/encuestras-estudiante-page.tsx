'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { useServerWebsockets } from '@/components/hooks/use-server-encuestas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nombreSplit } from '@/lib/utils'
import loginEst from '@/svg/loginEstSVGO2.svg'
import { RolEncuesta } from '@/wss/tipos'
import { Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'
import DibuEstudiante from '/svg/upssvgo.svg'
import {pulsarSecuencial, oscilar } from '@/lib/animaciones'


export default function EncuestasEstudiantePage({
  idSala,
  btnLogoutGoogle,
}: {
  idSala: string
  btnLoginGoogle: ReactNode
  btnLogoutGoogle: ReactNode
}) {
  const [nombre, setNombre] = useState<string | undefined>(undefined)
  const [dni, setDNI] = useState<string | undefined>(undefined)
  const [ingresado, setIngresado] = useState(false)

  const inputNombreRef = useRef<HTMLInputElement>(null)
  const inputDNIRef = useRef<HTMLInputElement>(null)

  const [isClient, setIsClient] = useState(false)
  const { data: nextSession, status } = useSession()

  const nombreFinal = status === 'authenticated' ? nextSession?.user?.name || 'Usuario' : nombre

  const { socket } = useServerWebsockets({ rol: RolEncuesta.Publico, idSala })
  const [nombreSala, setNombreSala] = useState<string>()

  

  // Al obtener un socket suscribimos a sus señales
  useEffect(() => { 
    if(socket) socket.on('sala:nombre', setNombreSala)
  }, [socket])


  useEffect(() => {
    setIsClient(true)
    const storedName = localStorage.getItem(`encuestas-nombre-${idSala}`)
    if (storedName) {
      setNombre(storedName)
    }
    const storedDni = localStorage.getItem(`encuestas-dni-${idSala}`)
    if (storedDni) {
      setDNI(storedDni)
    }
  }, [idSala])

  const handleConectarse = () => {
    const valueNombre = inputNombreRef.current?.value?.trim()
    const valueDNI = inputDNIRef.current?.value?.trim()

    if (!valueDNI) {
      toast.warning(`Falta el DNI!`)
      return
    }

    if (valueNombre) {
      setNombre(valueNombre)
      localStorage.setItem(`encuestas-nombre-${idSala}`, valueNombre)
    }
    if (valueDNI) {
      setDNI(valueDNI)
      localStorage.setItem(`encuestas-dni-${idSala}`, valueDNI)
    }

    setIngresado(true)
  }

  if (status === 'loading' || !isClient) {
    return (
      <div className="w-screen h-screen place-content-center">
        <p className="text-xl md:text-6xl text-indigo-500 text-center">Cargando...</p>
      </div>
    )
  }

  //pantalla de sala invalida
 if (status ==='unauthenticated'&& !nombreSala){
  return<div>
    <div className="flex flex-col  items-center mb-10 justify-center">
          <LdSvg
            className="w-[300px] md:w-[500px]"
            SvgComponent={DibuEstudiante}
            ids={['signo1', 'signo2'] as const}
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)} />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">Esta sala no existe. Por favor, verifica el id de la sala</p>
        </div>
        
  </div>
 }

  // Formulario de acceso
  if (status === 'unauthenticated' && (!dni || !nombre || !ingresado)) {
    return (
      <div className="flex flex-col md:flex-row  bg-white shadow-2xl rounded-xl  gap-2 items-center text-center w-fit p-10 m-10">
        <LdSvg className="w-[200px] md:w-[500px] mr-8 drop-shadow-xl" SvgComponent={loginEst}
        ids={['item1', 'item2','item3','item4','item5', 'item6', 'Personaje'] as const}
        animation={pulsarSecuencial(['item1', 'item2', 'item3', 'item4','item5','item6'], 3000, 1.4)}
         />


        <div className="flex flex-col gap-2 text-center w-fit md:p-10">
          <div className="flex md:w-[20em] justify-center items-center mb-4 gap-4">
            <Image className="w-8 md:w-10" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
            <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
              <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
            </div>
          </div>
          <p className="w-80">
            {' '}
            Estás a punto de ingresar a la sala de <span className="text-teal-500">{nombreSala ?? idSala}</span>. 
            Ingresa con tu nombre y DNI 
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 pt-8">
              <Input
                className=" bg-indigo-100/50"
                placeholder="Ingresá tu nombre"
                id="nombre"
                ref={inputNombreRef}
                defaultValue={nombreFinal}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConectarse()
                  }
                }}
              />
              <Input
                className=" bg-indigo-100/50"
                placeholder="Ingresá tu DNI"
                id="dni"
                ref={inputDNIRef}
                defaultValue={dni}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConectarse()
                  }
                }}
              />
            </div>
            <Button className=" bg-indigo-500/90 font-semibold" type="button" onClick={handleConectarse}>
              Conectarse
            </Button>

            {/* Descomentar para volver a habilitar login de google */}
            {/* <span>o</span>
            {btnLoginGoogle} */}
          </div>
        </div>
      </div>
    )
  }

  // Devolvemos la página
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre={nombreFinal} dni={dni}>
      <div className="min-h-screen w-screen mx-auto flex flex-col gap-8 items-center">
        <HeaderSala className="flex gap-2" btnLogout={status === 'authenticated' ? btnLogoutGoogle : undefined}>
          <p className="flex gap-2 justify-center items-center text-sm text-center sm:text-4xl">
            <Sparkles className=" w-4 md:w-10" />
            ¡Hola {nombreSplit(nombreFinal)}!<Sparkles className="w-4 md:w-10" />
          </p>
        </HeaderSala>
        <div className="p-2 w-[inherit] md:p-8">
          <EncuestasEstudiante />
        </div>
      </div>
    </EncuestaEstudianteProvider>
  )
}

