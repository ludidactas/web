'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { useServerWebsockets } from '@/components/hooks/use-server-encuestas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoginEst from '@/svg/loginEst.svg'
import { animate, spring, stagger } from 'animejs'

import { RolEncuesta } from '@/wss/tipos'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'

import { oscilar } from '@/lib/animaciones'
import { PasaportePublico } from '@/wss/validators/auth'
import DibuEstudiante from '/svg/upssvgo.svg'
import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'

/** Página de login a sala, donde pedimos nombre y DNI */
export default function LoginSalaEstudiante({ idSala }: { idSala: string }) {
  const { setDNI, setNombre, setIngresado, nombre, dni, configSala, setConfigSala } = useEncuestaEstudianteLogin()

  // Creamos una referencia estable al auth
  const authPublico = useMemo(
    () =>
      ({
        rol: RolEncuesta.Publico,
        idSala,
      } as PasaportePublico),
    [idSala]
  )

  // Nos conectamos al socket como rol publico para obtener el nombre de sala (y en el futuro, config)
  // Ojo: esto captura el websocket!
  // (es decir, si un children utiliza el mismo hook con otras credenciales, van a entrar en conflicto)
  const { socket, estado } = useServerWebsockets(authPublico)

  // Al obtener un socket suscribimos a sus señales
  useEffect(() => {
    if (socket) {
      socket.on('sala:config', setConfigSala)
    }
  }, [socket])

  const inputNombreRef = useRef<HTMLInputElement>(null)
  const inputDNIRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
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

  if (estado === StatusDeConexion.Error)
    return (
      <div className="w-screen h-screen place-content-center">
        <p className="text-xl md:text-6xl text-red-500 text-center">Error de conexión. Por favor, recargá la página.</p>
      </div>
    )

  // Pantalla de sala inválida - Si no estamos en un estado de conexión "sano" y no tenemos config de sala
  if (estado === StatusDeConexion.Conectado && !configSala)
    return (
      <div>
        <div className="flex flex-col  items-center mb-10 justify-center">
          <LdSvg
            className="w-[300px] md:w-[500px]"
            SvgComponent={DibuEstudiante}
            ids={['signo1', 'signo2'] as const}
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)}
          />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">
            Esta sala no existe. Por favor, verifica el id de la sala
          </p>
        </div>
      </div>
    )

  if (estado !== StatusDeConexion.Conectado || !configSala)
    return (
      <div className="w-screen h-screen place-content-center">
        <p className="text-xl md:text-6xl text-indigo-500 text-center">Cargando...</p>
      </div>
    )

  return (
    <div className="flex flex-col md:flex-row  bg-white shadow-2xl rounded-xl  gap-2 items-center text-center w-fit p-10 m-10">
      <LdSvg
        className="w-[200px] md:w-[500px] mr-8 drop-shadow-xl"
        SvgComponent={LoginEst}
        ids={['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'Personaje'] as const}
        animate={(nodos) => () => {
          animate([nodos.item6, nodos.item2, nodos.item3, nodos.item5, nodos.item1, nodos.item4, ,], {
            scale: [
              { to: 1.02, ease: 'inOut(3)', duration: 200 },
              { to: 1, ease: spring({ bounce: 0.8 }) },
            ],
            delay: stagger(100),
            loop: true,
          })
        }}
      />

      <div className=" flex flex-col gap-2 text-center w-fit md:p-10">
        <div className="flex md:w-[20em] justify-center items-center mb-4 gap-4">
          <Image className="w-8 md:w-10" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px]" src="/img/lema_sketchy.gif" alt={''} width={200} height={200} />
          </div>
        </div>
        <p className="w-80">
          {' '}
          Estás a punto de ingresar a la sala <span className="text-teal-500">{configSala.nombre_profe ?? idSala}</span>
          . Ingresa tu nombre y DNI.
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
          <Button className=" bg-[#6F41CB] font-semibold" type="button" onClick={handleConectarse}>
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
