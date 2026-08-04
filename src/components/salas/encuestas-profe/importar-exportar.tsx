'use client'

import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

/** UI para importar/exportar -- pendiente revisar/mejorar @comomaraleja */
export function ImportarExportar() {
  const { crear, borrar } = useConexionProfe()
  const { items: encuestas } = storeEncuestasProfe()

  const [abierto, setAbierto] = useState(false)
  const [exportarAbierto, setExportarAbierto] = useState(false)
  const [borrarAbierto, setBorrarAbierto] = useState(false)
  const [nombre, setNombre] = useState('Colección de preguntas')
  const [presets, setPresets] = useState<PresetColeccion[]>([])
  const [url, setUrl] = useState('')
  const [importando, setImportando] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  // Cargamos los presets disponibles al abrir el diálogo
  useEffect(() => {
    if (abierto && presets.length === 0) obtenerPresets().then(setPresets)
  }, [abierto, presets.length])

  const exportar = () => {
    const nombreFinal = nombre.trim() || 'Colección de preguntas'

    // Descargamos
    descargarColeccion(nombreFinal, encuestas)

    // Notificamos
    const unaSola = encuestas.length === 1
    toast.success(`${encuestas.length} pregunta${unaSola ? '' : 's'} exportada${unaSola ? '' : 's'}`)

    // Cerramos el dialog
    setExportarAbierto(false)
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

  /** Parsea texto YAML e importa sus preguntas, cerrando el dialog al final */
  const procesarTexto = async (texto: string) => {
    let sobre
    try {
      sobre = parsearColeccion(texto)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo leer la colección')
      return
    }
    setAbierto(false)
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

  /** Borra todas las preguntas de la sala (una por una vía la misma acción del botón Eliminar). */
  const borrarTodo = () => {
    const cantidad = encuestas.length
    encuestas.forEach((encuesta) => borrar(encuesta.id))
    toast.success(`${cantidad} pregunta${cantidad === 1 ? '' : 's'} eliminada${cantidad === 1 ? '' : 's'}`)
    setBorrarAbierto(false)
  }

  return (
    <div className="flex gap-3 items-center justify-center text-sm mt-1">
      <button
        className="flex items-center gap-1 text-ld-azul hover:font-bold hover:underline disabled:text-slate-300 disabled:no-underline disabled:font-normal"
        onClick={() => setExportarAbierto(true)}
        disabled={encuestas.length === 0}
        title="Descargar las preguntas de esta sala como un archivo YAML"
      >
        <Icon icon="mdi:download" /> Exportar
      </button>

      <Dialog open={exportarAbierto} onOpenChange={setExportarAbierto}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Exportar preguntas</DialogTitle>
            <DialogDescription className="text-center">
              Se descargará un archivo YAML con las {encuestas.length} pregunta(s) de esta sala.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>

      <button
        className="flex items-center gap-1 text-ld-azul hover:font-bold hover:underline"
        onClick={() => setAbierto(true)}
        title="Crear preguntas a partir de un archivo o una colección"
      >
        <Icon icon="mdi:upload" /> Importar
      </button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Importar preguntas</DialogTitle>
            <DialogDescription className="text-center">
              Cada pregunta se crea por separado. Si alguna falla, las demás se crean igual.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>

      <button
        className="flex items-center gap-1 text-rose-600 hover:font-bold hover:underline disabled:text-slate-300 disabled:no-underline disabled:font-normal"
        onClick={() => setBorrarAbierto(true)}
        disabled={encuestas.length === 0}
        title="Eliminar todas las preguntas de esta sala"
      >
        <Icon icon="mdi:trash-can" /> Borrar todo
      </button>

      <Dialog open={borrarAbierto} onOpenChange={setBorrarAbierto}>
        <DialogContent className="flex flex-col items-center">
          <DialogHeader>
            <DialogTitle className="text-center leading-6">
              ¿Eliminar las {encuestas.length} pregunta(s) de la sala?
            </DialogTitle>
            <DialogDescription className="text-center">Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <button
              className="bg-emerald-700/90 text-white px-4 py-2 min-w-40 text-xl rounded-full"
              onClick={() => setBorrarAbierto(false)}
            >
              Cancelar
            </button>
            <button
              className="flex items-center gap-1 bg-rose-700 text-white px-4 py-2 rounded-full"
              onClick={borrarTodo}
            >
              <Icon icon="mdi:trash-can" /> Borrar todo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
