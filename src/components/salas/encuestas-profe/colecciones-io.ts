import { parse, stringify } from 'yaml'

import { aSlug, descargarArchivo } from '@/lib/utils'
import { PreguntaColeccion, sobreColeccion, VERSION_COLECCION } from '@/wss/validators/colecciones'
import { EncuestaHidratadaProfe } from '@/wss/validators/polls'

/** Un preset listado en `/colecciones/manifest.json`. */
export interface PresetColeccion {
  nombre: string
  descripcion?: string
  /** Ruta del YAML: o bien relativa a `/colecciones/` (presets) o bien URL absoluta. */
  archivo: string
}

/** Reduce una encuesta viva (con votos, status de publicación, etc.) a su forma exportable/importable. */
export function encuestaAPregunta(encuesta: EncuestaHidratadaProfe): PreguntaColeccion {
  return {
    pregunta: encuesta.pregunta,
    // Omitida si no tiene, para no ensuciar el YAML con `descripcion: null`.
    ...(encuesta.descripcion ? { descripcion: encuesta.descripcion } : {}),
    opciones: encuesta.opciones.map((opcion) => opcion.texto),
    admiteAportes: encuesta.admiteAportes,
    admiteMultiplesVotos: encuesta.admiteMultiplesVotos,
    maxMultiplesVotos: encuesta.maxMultiplesVotos,
  }
}

/** Serializa una colección de preguntas a texto YAML. */
export function serializarColeccion(nombre: string, encuestas: EncuestaHidratadaProfe[]): string {
  return stringify({
    version: VERSION_COLECCION,
    nombre,
    preguntas: encuestas.map(encuestaAPregunta),
  })
}

/** Genera y dispara la descarga de un YAML con las preguntas dadas en el dispositivo del usuario. */
export function descargarColeccion(nombre: string, encuestas: EncuestaHidratadaProfe[]): void {
  const yaml = serializarColeccion(nombre, encuestas)
  descargarArchivo(yaml, `${aSlug(nombre, 'coleccion-preguntas')}.yaml`, 'text/yaml;charset=utf-8')
}

/** Parsea texto YAML a un sobre de colección. Lanza si el YAML es inválido o no respeta la forma. */
export function parsearColeccion(texto: string): { nombre?: string; preguntas: unknown[] } {
  const crudo = parse(texto)
  const resultado = sobreColeccion.safeParse(crudo)
  if (!resultado.success) {
    throw new Error('El archivo no tiene el formato de una colección de preguntas')
  }
  return resultado.data
}

/** Descarga el texto YAML de una colección desde una URL. `archivo` puede ser relativo a `/colecciones/`. */
export async function obtenerColeccionDesdeUrl(archivo: string): Promise<string> {
  const url = /^https?:\/\//.test(archivo) ? archivo : `/colecciones/${archivo.replace(/^\/+/, '')}`
  const respuesta = await fetch(url)
  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar la colección (${respuesta.status})`)
  }
  return respuesta.text()
}

/**
 * Descarga el manifest de presets (es decir la lista de presets nuestros disponibles).
 * Devuelve lista vacía si no existe o falla.
 */
export async function obtenerPresets(): Promise<PresetColeccion[]> {
  try {
    const respuesta = await fetch('/colecciones/manifest.json')
    if (!respuesta.ok) return []
    const datos = await respuesta.json()
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}
