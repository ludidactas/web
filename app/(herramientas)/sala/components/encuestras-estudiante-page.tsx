'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconoRandom } from '@/lib/iconos'
import { nombreSplit } from '@/lib/utils'
import loginEst from '@/svg/loginEstsvgo.svg'
import { Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import EncuestasEstudiante from './encuestas-estudiante'
import { EncuestaEstudianteProvider } from './encuestas-estudiante-context'
import HeaderSala from './header-sala'
import { useServerWebsockets } from '@/components/hooks/use-server-encuestas'
import { RolEncuesta } from '@/wss/tipos'

export default function EncuestasEstudiantePage({
  idSala,
  btnLoginGoogle,
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

  // Formulario de acceso
  if (status === 'unauthenticated' && (!dni || !nombre || !ingresado)) {
    return (
      <div className="flex flex-col md:flex-row shadow-2xl gap-4 bg-white items-center rounded-xl text-center justify-self-center w-fit p-10 m-10">
        <LdSvg className="w-[200px] md:w-[300px] mr-8 drop-shadow-xl" SvgComponent={loginEst} />

        <div className=" flex flex-col gap-2 text-center  justify-self-center w-fit md:p-10">
          <div className="flex md:w-[20em] justify-center items-center mb-4 gap-4">
            <Image className="w-8 md:w-10" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
            <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
              <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
            </div>
          </div>
          <p className="w-80">
            {' '}
            Estás a punto de ingresar a la sala <span className="text-teal-500">{nombreSala ?? idSala}</span>. Te podés
            conectar con tu nombre o con tu cuenta de google
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
              Conectarse con nombre y DNI
            </Button>
            <span>o</span>
            {btnLoginGoogle}
          </div>
        </div>
      </div>
    )
  }

  // Devolvemos la página
  return (
    <EncuestaEstudianteProvider idSala={idSala} nombre={nombreFinal} icono={IconoRandom()} dni={dni}>
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

