'use client'

import { LdSvg } from '@/components/custom/ld-svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { oscilar } from '@/lib/animaciones'
import { track } from '@/lib/analytics'
import LoginEst from '@/svg/dist/ui/loginEst2.svg'
import { animate, spring, stagger } from 'animejs'
import { Icon } from '@iconify/react/dist/iconify.js'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { accionSignInEstudiante } from '@/server/login-estudiante'
import { toast } from 'sonner'
import LoadingSala from '../loading-sala'
import DibuEstudiante from '/svg/dist/ilustraciones/ups.svg'
import logoSketchy from '@/img/logo_sketchy.gif'
import lemaSketchy from '@/img/lema_sketchy.gif'

import { borrarDni, guardarDni } from '@/wss-cli/dni-guardado'
import { StatusDeConexion } from '@/wss-cli/conexion-wss'
import { useLoginSalaEstudiante } from '@/wss-cli/providers/wss-estudiante-login-context'
import { useConexionPublico } from '@/wss-cli/providers/wss-public-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { MAX_LEN_DNI, MAX_LEN_NOMBRE, MetodosLogin } from '@/wss/validators/auth'

/** Página de login a sala: pide lo que la identidad de la sala requiere (nombre, nombre y DNI, o cuenta de Google). */

export default function LoginSalaEstudiante({ idSala }: { idSala: string }) {
  const { confirmadoNoExiste, confirmadoError, error, averiguandoEstado, estado } =
    useConexionPublico()

  const { setDNI, setNombre, setIngresado, nombre, dni, google } = useLoginSalaEstudiante({ idSala })

  const { config: configSala } = storeConfig()

  const pideDni = configSala?.metodo_login === MetodosLogin.DNI
  const esGoogle = configSala?.metodo_login === MetodosLogin.Google

  const mensajeDeAuth = `Ingresá con tu nombre${pideDni ? ' y DNI' : ''}`
  const nombreSala = configSala?.nombre?.trim() || (configSala?.nombre_profe ? `de ${configSala.nombre_profe}` : idSala)

  const inputNombreRef = useRef<HTMLInputElement>(null)
  const inputDNIRef = useRef<HTMLInputElement>(null)

  // Al clickear en conectarse
  const handleConectarse = () => {
    const valueNombre = inputNombreRef.current?.value?.trim()
    const valueDNI = inputDNIRef.current?.value?.trim()

    if (pideDni && !valueDNI) {
      toast.warning(`Falta el DNI!`)
      return
    }

    if (valueNombre) {
      setNombre(valueNombre)
      localStorage.setItem(`encuestas-nombre-${idSala}`, valueNombre)
    }

    if (valueDNI) {
      setDNI(valueDNI)
      guardarDni(idSala, valueDNI)
    } else {
      setDNI(undefined)
      borrarDni(idSala)
    }

    // Esto triggerea el ingreso (que se renderice el `EncuestaEstudianteProvider`)
    setIngresado(true)
    track({ event: 'sala_acceso_estudiante', metodo_login: configSala?.metodo_login })
    localStorage.setItem(`encuestas-ingresado-${idSala}`, `1`)
  }

  /** Sala `google`: la sesión ya está abierta; confirmar es lo que dispara el ingreso. */
  const handleIngresarConGoogle = () => {
    setIngresado(true)
    track({ event: 'sala_acceso_estudiante', metodo_login: configSala?.metodo_login })
    localStorage.setItem(`encuestas-ingresado-${idSala}`, `1`)
  }

  // Pantalla de sala inválida - Si no estamos en un estado de conexión "sano" y no tenemos config de sala
  if (confirmadoNoExiste)
    return (
      <div>
        <div className="flex flex-col items-center mb-10 justify-center">
          <LdSvg
            className="w-[300px] md:w-[500px]"
            SvgComponent={DibuEstudiante}
            ids={['signo1', 'signo2'] as const}
            animation={oscilar(['signo1', 'signo2'], 2, 1, 0.4)}
          />

          <p className="text-gray-500 text-xl font-bold md:w-[400px] text-center ">
            Esta sala no existe. Por favor, verifica el id de la sala
          </p>

          <Link className="hover:underline text-gray-500 mt-8" href="/">
            Volver al sitio
          </Link>
        </div>
      </div>
    )

  if (confirmadoError)
    return (
      <div className="w-screen h-screen flex flex-col items-center place-content-center gap-4">
        <p className="text-xl md:text-4xl text-red-500 text-center">Error de conexión. Por favor, recargá la página.</p>
        <p className="text-xl md:text-2xl text-red-500 text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>Recargar página</Button>
      </div>
    )

  if (averiguandoEstado) return <LoadingSala overlay mensaje="Verificando estado..." />

  if (estado !== StatusDeConexion.Conectado) return <LoadingSala overlay mensaje="Conectando con servidor en vivo..." />

  if (!configSala) return <LoadingSala overlay mensaje="Solicitando configuración de sala..." />

  if (esGoogle && google.status === 'loading') return <LoadingSala overlay mensaje="Verificando tu sesión..." />

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
          <Image className="w-8 md:w-10 h-auto" src={logoSketchy} alt="" />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px] h-auto" src={lemaSketchy} alt="Ludidactas" />
          </div>
        </div>

        <p className="w-80">
          Estás a punto de ingresar a la sala <span className="text-teal-500">{nombreSala}</span>.
        </p>
        {esGoogle ? (
          <IngresoGoogle
            idSala={idSala}
            usuario={google.usuario}
            autenticado={google.status === 'authenticated'}
            onIngresar={handleIngresarConGoogle}
          />
        ) : (
          <>
            <p className="w-80">{mensajeDeAuth}.</p>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 pt-8">
                {/* Nombre -- lo pedimos siempre */}
                <Input
                  className=" bg-indigo-100/50"
                  placeholder="Ingresá tu nombre"
                  id="nombre"
                  ref={inputNombreRef}
                  defaultValue={nombre}
                  maxLength={MAX_LEN_NOMBRE}
                  required
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConectarse()
                    }
                  }}
                />

                {/* DNI -- configurable */}
                {pideDni && (
                  <Input
                    className=" bg-indigo-100/50"
                    placeholder="Ingresá tu DNI"
                    id="dni"
                    ref={inputDNIRef}
                    defaultValue={dni}
                    maxLength={MAX_LEN_DNI}
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConectarse()
                      }
                    }}
                  />
                )}
              </div>
              <Button className=" bg-ld-violeta-oscuro font-semibold" type="button" onClick={handleConectarse}>
                Conectarse con nombre {pideDni ? 'y DNI' : ''}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Ingreso a una sala `google`. Elegir cuenta lleva al selector del proveedor y, al volver con la sesión
 * abierta, entra directo: haberla elegido ahí ya es la confirmación. La pantalla de confirmación aparece
 * solo cuando ya había una sesión abierta (p. ej. la cuenta del profe en el mismo navegador).
 */
function IngresoGoogle({
  idSala,
  usuario,
  autenticado,
  onIngresar,
}: {
  idSala: string
  usuario?: { name?: string | null; email?: string | null; image?: string | null }
  autenticado: boolean
  onIngresar: () => void
}) {
  const elegirCuenta = async () => {
    localStorage.setItem(`encuestas-ingresado-${idSala}`, '1')
    await accionSignInEstudiante(`/sala/${idSala}/`)
  }

  if (!autenticado)
    return (
      <>
        <p className="w-80">Ingresá con tu cuenta de Google. Solo usamos tu nombre y tu email.</p>
        <div className="pt-10">
          <Button className="bg-ld-violeta-oscuro font-semibold w-full gap-2" type="button" onClick={elegirCuenta}>
            <Icon icon="simple-icons:google" className="h-4 w-4" aria-hidden />
            Ingresar con Google
          </Button>
        </div>
      </>
    )

  return (
    <>
      <p className="w-80">Vas a ingresar con esta cuenta:</p>
      <div className="flex items-center gap-3 rounded-lg border p-3 text-left">
        {usuario?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={usuario.image} alt="" className="h-10 w-10 shrink-0 rounded-full" referrerPolicy="no-referrer" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{usuario?.name}</span>
          <span className="truncate text-sm text-muted-foreground">{usuario?.email}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-10">
        <Button className="bg-ld-violeta-oscuro font-semibold" type="button" onClick={onIngresar}>
          Ingresar a la sala
        </Button>
        <button
          type="button"
          onClick={elegirCuenta}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Usar otra cuenta
        </button>
      </div>
    </>
  )
}
