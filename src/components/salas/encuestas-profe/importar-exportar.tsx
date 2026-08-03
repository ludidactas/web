'use client'

import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { extractZodErrorMessages } from '@/wss/utils'
import { crearEncuesta } from '@/wss/validators/polls'

import {
  descargarColeccion,
  obtenerColeccionDesdeUrl,
  obtenerPresets,
  parsearColeccion,
  PresetColeccion,
} from './colecciones-io'
import { aSlug } from '@/lib/utils'

type Vista = 'menu' | 'exportar' | 'importar'

const TITULOS: Record<Vista, string> = {
  menu: 'Colecciones',
  exportar: 'Exportar preguntas',
  importar: 'Importar preguntas',
}

/** UI para importar/exportar -- pendiente revisar/mejorar @comomaraleja */
export function ImportarExportar() {
  const { crear } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()

  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [vista, setVista] = useState<Vista>('menu')
  const [nombre, setNombre] = useState('Colección de preguntas')
  const [presets, setPresets] = useState<PresetColeccion[]>([])
  const [url, setUrl] = useState('')
  const [importando, setImportando] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  // Cargamos los presets disponibles al entrar a la vista de importar
  useEffect(() => {
    if (vista === 'importar' && presets.length === 0) obtenerPresets().then(setPresets)
  }, [vista, presets.length])

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
        `${omitidas} ya ${omitidas === 1 ? 'existía' : 'existían'} en la sala y no se ${omitidas === 1 ? 'duplicó' : 'duplicaron'
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
          <DrawerClose
            className="absolute right-4 top-4 text-ld-violeta"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <Icon icon="material-symbols:close-rounded" className="w-6 h-6" />
          </DrawerClose>

          <div className="flex items-center gap-2">
            {vista !== 'menu' && (
              <button
                className="text-ld-violeta"
                onClick={() => setVista('menu')}
                aria-label="Volver"
                title="Volver"
              >
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
              <p className='text-center'>Puedes exportar la lista de preguntas que creaste o importar una lista de preguntas en formato yaml. También hemos creado colecciones de ejemplo listas para usar. </p>

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
