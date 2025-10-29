'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { useServerWebsockets } from '@/components/hooks/use-server-encuestas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import loginEst from '@/svg/loginEstsvgo.svg'
import { RolEncuesta } from '@/wss/tipos'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'

/** Página de login a sala, donde pedimos nombre y DNI */
export default function LoginSalaEstudiante({ idSala }: { idSala: string }) {
  const { setDNI, setNombre, setIngresado, setNombreSala, nombreSala, nombre, dni } = useEncuestaEstudianteLogin()

  // Nos conectamos al socket como rol publico para obtener el nombre de sala (y en el futuro, config)
  // Ojo: esto captura el websocket! 
  // (es decir, si un children utiliza el mismo hook con otras credenciales, van a entrar en conflicto)
  const { socket } = useServerWebsockets({ rol: RolEncuesta.Publico, idSala })

  // Al obtener un socket suscribimos a sus señales
  useEffect(() => {
    if (socket) socket.on('sala:nombre', setNombreSala)
  }, [socket])

  const [isClient, setIsClient] = useState(false)
  
  const inputNombreRef = useRef<HTMLInputElement>(null)
  const inputDNIRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="flex flex-col md:flex-row shadow-2xl gap-4 bg-white items-center rounded-xl text-center w-fit p-10 m-10">
      <LdSvg className="w-[200px] md:w-[330px] mr-8 drop-shadow-xl" SvgComponent={loginEst} />

      <div className=" flex flex-col gap-2 text-center w-fit md:p-10">
        <div className="flex md:w-[20em] justify-center items-center mb-4 gap-4">
          <Image className="w-8 md:w-10" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
          </div>
        </div>
        <p className="w-80">
          {' '}
          Estás a punto de ingresar a la sala <span className="text-teal-500">{nombreSala ?? idSala}</span>. Ingresa tu
          nombre y DNI.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 pt-8">
            <Input
              className=" bg-indigo-100/50"
              placeholder="Ingresá tu nombre"
              id="nombre"
              ref={inputNombreRef}
              defaultValue={nombre}
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
            Conectarse con nombre y DNI
          </Button>

          {/* Descomentar para volver a habilitar login de google */}
          {/* <span>o</span>
            {btnLoginGoogle} */}
        </div>
      </div>
    </div>
  )
}
