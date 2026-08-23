'use client'

import { Icon } from '@iconify/react'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { conectarConDrive } from '@/lib/google/conexion'
import {
  ColeccionPreguntasEnDrive,
  DriveNoConectado,
  guardarColeccion as guardarColeccionEnDrive,
  leerColecciones as leerColeccionesDeDrive,
} from '@/lib/google/recursos-colecciones'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { extractZodErrorMessages } from '@/wss/utils'
import { crearEncuesta } from '@/wss/validators/polls'

import {
  descargarColeccion,
  obtenerColeccionDesdeUrl,
  obtenerPresets,
  parsearColeccion,
  PresetColeccion,
  serializarColeccion,
} from './colecciones-io'
import { aSlug, cn } from '@/lib/utils'

type Vista = 'menu' | 'exportar' | 'importar'

const TITULOS: Record<Vista, string> = {
  menu: 'Colecciones',
  exportar: 'Exportar preguntas',
  importar: 'Importar preguntas',
}

const ICONO_DRIVE = 'ri:drive-fill'

type ColeccionDrive = PresetColeccion & { contenido: string; preguntas: number }

function aColeccionDrive({ archivo, contenido }: ColeccionPreguntasEnDrive): ColeccionDrive {
  try {
    const { nombre, preguntas } = parsearColeccion(contenido)
    return { archivo, contenido, nombre: nombre ?? archivo, preguntas: preguntas.length }
  } catch {
    return { archivo, contenido, nombre: archivo, preguntas: 0 }
  }
}

/** UI para importar/exportar -- pendiente revisar/mejorar @comomaraleja */
export function ImportarExportar({
  integracionGoogle,
  driveConectado: conectadoInicial,
  alImportar,
}: {
  integracionGoogle: boolean
  driveConectado: boolean
  alImportar: (nombre: string) => void
}) {
  const { crear } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()

  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [vista, setVista] = useState<Vista>('menu')
  const [nombre, setNombre] = useState('Colección de preguntas')
  const [presets, setPresets] = useState<PresetColeccion[]>([])
  const [url, setUrl] = useState('')
  const [importando, setImportando] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  const { idSala } = useParams<{ idSala: string }>()
  const [misColecciones, setMisColecciones] = useState<ColeccionDrive[] | null>(null)
  const [driveConectado, setDriveConectado] = useState(conectadoInicial)

  // Cargamos los presets disponibles al entrar a la vista de importar
  useEffect(() => {
    if (vista === 'importar' && presets.length === 0) obtenerPresets().then(setPresets)
  }, [vista, presets.length])

  const leerDrive = useCallback(
    () =>
      leerColeccionesDeDrive(idSala)
        .then((colecciones) => {
          setMisColecciones(colecciones.map(aColeccionDrive))
          setDriveConectado(true)
        })
        .catch((error: unknown) => {
          if (!(error instanceof DriveNoConectado)) {
            console.error('Drive: no se pudieron leer las colecciones', error)
          }
          setMisColecciones([])
          setDriveConectado(false)
        }),
    [idSala]
  )

  useEffect(() => {
    if (integracionGoogle && driveConectado && vista === 'importar' && misColecciones === null) leerDrive()
  }, [integracionGoogle, driveConectado, vista, misColecciones, leerDrive])

  const conectarDrive = () => {
    conectarConDrive().then((conectado) => {
      if (!conectado) return
      setDriveConectado(true)
      setMisColecciones(null)
    })
  }

  // Al cerrar el drawer, volvemos siempre al menú principal
  const alCambiarDrawer = (abierto: boolean) => {
    setDrawerAbierto(abierto)
    if (!abierto) setVista('menu')
  }

  const exportar = () => {
    const nombreFinal = nombre.trim() || 'Colección de preguntas'

    // Descargamos
    descargarColeccion(nombreFinal, encuestas)

    // Notificamos
    const unaSola = encuestas.length === 1
    toast.success(`${encuestas.length} pregunta${unaSola ? '' : 's'} exportada${unaSola ? '' : 's'}`)

    // Volvemos al menú
    setVista('menu')
  }

  /** Crea cada pregunta de forma independiente: una inválida no frena al resto. */
  const importarPreguntas = async (preguntas: unknown[]) => {
    if (preguntas.length === 0) {
      toast.info('La colección no tiene preguntas')
      return
    }

    // Derivamos "huellas", tipo extractos que permiten identificar preguntas iguales aunque no sean idénticas (ej: diferencias de mayúsculas o espacios).
    // Esto nos permite evitar crear preguntas duplicadas si ya existe una igual en la sala.
    const huellas = new Set(encuestas.map((e) => aSlug(e.pregunta)))

    let creadas = 0
    let omitidas = 0
    const errores: string[] = []

    // Iteramos las preguntas del YAML.
    // - Verificamos el formato.
    // - Verificamos repetidas (es decir, su huella ya está en `huellas`).
    // - La creamos, acumulando cualquier error que ocurra.
    for (const [i, cruda] of preguntas.entries()) {
      const parseada = crearEncuesta.safeParse(cruda)
      if (!parseada.success) {
        errores.push(`Pregunta #${i + 1}: ${extractZodErrorMessages(parseada.error)}`)
        continue
      }

      const huella = aSlug(parseada.data.pregunta)
      if (huellas.has(huella)) {
        omitidas++
        continue
      }
      huellas.add(huella)

      try {
        await crear(parseada.data)
        creadas++
      } catch (error) {
        errores.push(`"${parseada.data.pregunta}": ${typeof error === 'string' ? error : 'no se pudo crear'}`)
      }
    }

    // Mostramos resultados en un solo toast
    const partes: string[] = []
    if (creadas > 0)
      partes.push(
        `${creadas} pregunta${creadas === 1 ? '' : 's'} importada${creadas === 1 ? '' : 's'} de ${preguntas.length}`
      )
    if (omitidas > 0)
      partes.push(
        `${omitidas} ya ${omitidas === 1 ? 'existía' : 'existían'} en la sala y no se ${
          omitidas === 1 ? 'duplicó' : 'duplicaron'
        }`
      )
    if (partes.length > 0) {
      toast.info(partes.join('. '))
    }

    // Mostramos errores
    errores.forEach((mensaje) => toast.error(mensaje))
  }

  /** Parsea texto YAML e importa sus preguntas, volviendo al menú al final */
  const procesarTexto = async (texto: string) => {
    let sobre
    try {
      sobre = parsearColeccion(texto)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo leer la colección')
      return
    }
    if (sobre.nombre) alImportar(sobre.nombre)
    setVista('menu')
    await importarPreguntas(sobre.preguntas)
  }

  /** Envuelve la ejecución de una función con el estado de carga (activa al iniciar, desactiva al finalizar). */
  const correr = async (fn: () => Promise<void>) => {
    setImportando(true)
    try {
      await fn()
    } finally {
      setImportando(false)
    }
  }

  /** Función para consumir un archivo de texto subido por el usuario. */
  const importarArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite re-elegir el mismo archivo
    if (!archivo) return
    correr(async () => procesarTexto(await archivo.text()))
  }

  /** Descarga desde una URL/preset y delega a procesarTexto; aísla los errores de red. */
  const importarDesdeArchivoRemoto = (archivo: string) =>
    correr(async () => {
      let texto: string
      try {
        texto = await obtenerColeccionDesdeUrl(archivo)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo descargar la colección')
        return
      }
      await procesarTexto(texto)
    })

  const importarDesdeDrive = (coleccion: ColeccionDrive) =>
    correr(async () => {
      await procesarTexto(coleccion.contenido)
    })

  /** Función para consumir un archivo de texto provisto por URL */
  const importarUrl = () => {
    if (url.trim()) importarDesdeArchivoRemoto(url.trim())
  }

  return (
    <Drawer direction="right" open={drawerAbierto} onOpenChange={alCambiarDrawer}>
      <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
        <DrawerTrigger asChild>
          <button className="group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-ld-violeta hover:bg-ld-violeta/80 transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base">
            <Icon icon="mage:box-question-mark" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
              Colecciones
            </span>
          </button>
        </DrawerTrigger>
      </div>

      <DrawerContent>
        <DrawerHeader className="relative">
          <DrawerClose className="absolute right-4 top-4 text-ld-violeta" aria-label="Cerrar" title="Cerrar">
            <Icon icon="material-symbols:close-rounded" className="w-6 h-6" />
          </DrawerClose>

          <div className="flex items-center gap-2">
            {vista !== 'menu' && (
              <button className="text-ld-violeta" onClick={() => setVista('menu')} aria-label="Volver" title="Volver">
                <Icon icon="mdi:arrow-left" className="w-5 h-5" />
              </button>
            )}
            <DrawerTitle className="flex-1 text-center text-2xl text-ld-violeta">{TITULOS[vista]}</DrawerTitle>
            {vista !== 'menu' && <div className="w-5" />}
          </div>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-3 items-center text-sm mt-1 px-4 pb-6 overflow-y-auto">
          {vista === 'menu' && (
            <>
              <p className="text-center">
                Puedes exportar la lista de preguntas que creaste o importar una lista de preguntas en formato yaml.
                También hemos creado colecciones de ejemplo listas para usar.{' '}
              </p>

              <button
                className="flex items-center w-full justify-center gap-2 font-semibold text-white px-4 py-2 bg-ld-azul hover:bg-ld-azul/80 transition-colors disabled:text-slate-300 disabled:no-underline disabled:font-normal"
                onClick={() => setVista('exportar')}
                disabled={encuestas.length === 0}
                title="Descargar las preguntas de esta sala como un archivo YAML"
              >
                <Icon icon="mdi:download" /> Exportar
              </button>

              <button
                className="flex items-center w-full justify-center gap-2 font-semibold text-white px-4 py-2 bg-ld-violeta hover:bg-ld-violeta/80 transition-colors"
                onClick={() => setVista('importar')}
                title="Crear preguntas a partir de un archivo o una colección"
              >
                <Icon icon="mdi:upload" /> Importar
              </button>
            </>
          )}

          {vista === 'exportar' && (
            <div className="flex w-full flex-col gap-3">
              <p className="text-center text-slate-500">
                Se descargará un archivo YAML con las {encuestas.length} pregunta(s) de esta sala.
              </p>

              <p className="font-bold text-ld-violeta">Nombre de la colección</p>
              <input
                className="rounded border p-2"
                type="text"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                onKeyDown={(evento) => evento.key === 'Enter' && exportar()}
                placeholder="Colección de preguntas"
                autoFocus
              />
              <button
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2"
                onClick={exportar}
              >
                <Icon icon="mdi:download" /> Descargar YAML
              </button>
            </div>
          )}

          {vista === 'importar' && (
            <div className="flex w-full flex-col gap-3">
              <p className="text-center text-slate-500">
                Cada pregunta se crea por separado. Si alguna falla, las demás se crean igual.
              </p>

              {/* Subir archivo */}
              <p className="font-bold text-ld-violeta">Desde un archivo</p>
              <input
                ref={inputArchivo}
                type="file"
                accept=".yaml,.yml,text/yaml"
                className="hidden"
                onChange={importarArchivo}
              />
              <button
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2 disabled:bg-slate-300"
                onClick={() => inputArchivo.current?.click()}
                disabled={importando}
              >
                <Icon icon="mdi:file-upload" /> Elegir archivo YAML
              </button>

              {/* Desde URL */}
              <p className="font-bold text-ld-violeta mt-2">Desde una URL</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 rounded border p-2"
                  type="url"
                  placeholder="https://.../coleccion.yaml"
                  value={url}
                  onChange={(evento) => setUrl(evento.target.value)}
                  onKeyDown={(evento) => evento.key === 'Enter' && importarUrl()}
                />
                <button
                  className="flex items-center gap-1 rounded-full bg-ld-violeta text-white px-4 py-2 disabled:bg-slate-300"
                  onClick={importarUrl}
                  disabled={importando || !url.trim()}
                >
                  <Icon icon="mdi:cloud-download" /> Cargar
                </button>
              </div>

              {integracionGoogle && (
                <>
                  {/* Mis colecciones en Drive */}
                  <p className="font-bold text-ld-violeta mt-2 flex items-center gap-1">
                    Mis colecciones <Icon icon={ICONO_DRIVE} className="w-4 h-4" />
                  </p>

                  {!driveConectado ? (
                    <button
                      className="flex items-center justify-center gap-2 rounded-full bg-ld-azul text-white px-4 py-2"
                      onClick={conectarDrive}
                    >
                      <Icon icon={ICONO_DRIVE} /> Conectar con Google Drive
                    </button>
                  ) : misColecciones === null ? (
                    <p className="text-xs text-slate-500">Leyendo tu Google Drive…</p>
                  ) : misColecciones.length === 0 ? (
                    <p className="text-xs text-slate-500">Todavía no guardaste ninguna colección.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {misColecciones.map((coleccion) => (
                        <button
                          key={coleccion.archivo}
                          className="flex flex-col items-start rounded-lg border border-ld-violeta/30 bg-[#f2ebff] px-4 py-2 text-left hover:border-ld-violeta disabled:opacity-50"
                          onClick={() => importarDesdeDrive(coleccion)}
                          disabled={importando}
                        >
                          <span className="font-semibold text-ld-violeta">{coleccion.nombre}</span>
                          <span className="text-xs text-slate-500">
                            {coleccion.preguntas} pregunta{coleccion.preguntas === 1 ? '' : 's'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Presets */}
              {presets.length > 0 && (
                <>
                  <p className="font-bold text-ld-violeta mt-2">Colecciones de ejemplo</p>
                  <div className="flex flex-col gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.archivo}
                        className="flex flex-col items-start rounded-lg border border-ld-violeta/30 bg-[#f2ebff] px-4 py-2 text-left hover:border-ld-violeta disabled:opacity-50"
                        onClick={() => importarDesdeArchivoRemoto(preset.archivo)}
                        disabled={importando}
                      >
                        <span className="font-semibold text-ld-violeta">{preset.nombre}</span>
                        {preset.descripcion && <span className="text-xs text-slate-500">{preset.descripcion}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function GuardarEnDrive({
  driveConectado: conectadoInicial,
  abierta,
  alGuardar,
}: {
  driveConectado: boolean
  abierta: string | null
  alGuardar: (nombre: string) => void
}) {
  const { items: encuestas } = storeEncuestasProfe()
  const config = storeConfig((estado) => estado.config)
  const { idSala } = useParams<{ idSala: string }>()

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [existentes, setExistentes] = useState<string[]>([])
  const [verificando, setVerificando] = useState(false)
  const [conectado, setConectado] = useState(conectadoInicial)

  const nombreFinal = nombre.trim()
  const sobrescribe = nombreFinal.length > 0 && existentes.some((otro) => aSlug(otro) === aSlug(nombreFinal))

  const leerExistentes = () =>
    leerColeccionesDeDrive(idSala)
      .then((colecciones) => {
        setExistentes(colecciones.map((coleccion) => aColeccionDrive(coleccion).nombre))
        setConectado(true)
      })
      .catch((error: unknown) => {
        if (error instanceof DriveNoConectado) {
          setConectado(false)
          return
        }
        console.error('Drive: no se pudieron leer las colecciones', error)
      })

  const abrirDialogo = () => {
    setNombre(abierta ?? '')
    setExistentes([])

    if (!conectado) {
      setDialogoAbierto(true)
      return
    }

    setVerificando(true)
    leerExistentes().finally(() => {
      setVerificando(false)
      setDialogoAbierto(true)
    })
  }

  const conectar = () => {
    conectarConDrive().then((listo) => {
      if (!listo) return
      setConectado(true)
      leerExistentes()
    })
  }

  const guardar = async () => {
    if (!nombreFinal) return

    setDialogoAbierto(false)
    setGuardando(true)
    try {
      await guardarColeccionEnDrive(
        idSala,
        config?.nombre ?? idSala,
        nombreFinal,
        serializarColeccion(nombreFinal, encuestas)
      )

      alGuardar(nombreFinal)
      toast.success(`"${nombreFinal}" guardada en tu Google Drive`)
    } catch (error) {
      if (error instanceof DriveNoConectado) {
        setConectado(false)
        toast.info('Necesitamos tu permiso para guardar en Google Drive', {
          action: { label: 'Conectar', onClick: conectar },
        })
        return
      }

      console.error('Drive: no se pudo guardar la colección', error)
      toast.error('No se pudo guardar la colección en tu Google Drive')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
      <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
        <button
          className="group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-emerald-600 hover:bg-emerald-600/80 transition-colors disabled:text-slate-500 disabled:bg-slate-100 disabled:no-underline disabled:font-normal md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base"
          disabled={encuestas.length === 0 || guardando || verificando}
          title="Guardar estas preguntas como una colección en tu Google Drive"
          onClick={abrirDialogo}
        >
          <Icon
            icon={verificando ? 'mdi:loading' : ICONO_DRIVE}
            className={cn('w-4 h-4 md:w-5 md:h-5 shrink-0', verificando && 'animate-spin')}
          />
          <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
            Guardar
          </span>
        </button>
      </div>

      <DialogContent className="flex flex-col items-center">
        <DialogHeader>
          <DialogTitle className="text-center leading-6">Guardar en tu Google Drive</DialogTitle>
        </DialogHeader>
        <p className="text-center text-slate-500">
          Se guardarán las {encuestas.length} pregunta(s) de esta sala como una colección.
        </p>
        <input
          className="w-full rounded border p-2"
          type="text"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          onKeyDown={(evento) => evento.key === 'Enter' && conectado && guardar()}
          placeholder="Nombre de la colección"
          autoFocus
        />
        {sobrescribe && (
          <p className="flex items-center gap-1 text-center text-sm text-amber-600">
            <Icon icon="mdi:alert-outline" className="shrink-0" />
            Ya tenés una colección con este nombre. Si guardás, la vas a sobrescribir.
          </p>
        )}
        {!conectado && (
          <p className="text-center text-sm text-slate-500">Necesitamos tu permiso para guardar en tu Google Drive.</p>
        )}
        <div className="flex gap-2">
          <DialogClose asChild>
            <button className="bg-slate-200 px-4 py-2 min-w-40 rounded-full">Cancelar</button>
          </DialogClose>
          {conectado ? (
            <button
              className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-full disabled:bg-slate-300"
              onClick={guardar}
              disabled={!nombreFinal}
            >
              <Icon icon={ICONO_DRIVE} /> {sobrescribe ? 'Sobrescribir' : 'Guardar'}
            </button>
          ) : (
            <button className="flex items-center gap-1 bg-ld-azul text-white px-4 py-2 rounded-full" onClick={conectar}>
              <Icon icon={ICONO_DRIVE} /> Conectar con Google Drive
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
