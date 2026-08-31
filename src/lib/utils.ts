import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as XLSX from 'xlsx'

import { MetodosLogin } from '@/wss/validators/auth'
import type { PlanillaCompleta } from '@/wss-cli/handlers/profe-sala-activa-handlers'
import { ConfigSala } from '@/wss/validators/salas'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nombreSplit(username: string | null | undefined): string {
  if (!username) return 'Anónimx'
  if (username.includes(' ')) return username.split(' ')[0]
  return username
}

/**
 * Convierte un texto libre en un slug seguro para usar como nombre de archivo:
 * sin acentos, en minúsculas y con guiones en lugar de espacios/símbolos.
 *
 * @param texto Texto a convertir (p. ej. el nombre que escribe el usuario).
 * @param fallback Valor a devolver si el resultado queda vacío (texto sin caracteres alfanuméricos).
 *
 * @example aSlug('¡Conceptos de Programación! 🎉') // => 'conceptos-de-programacion'
 */
export function aSlug(texto: string, fallback = 'archivo'): string {
  const limpio = texto
    // Descomponer caracteres acentuados en su forma base + acento, para eliminar los acentos fácilmente.
    .normalize('NFD')
    // Eliminar los caracteres de acento (que ahora son caracteres separados) y otros símbolos diacríticos.
    .replace(/[̀-ͯ]/g, '')
    // Reemplazar cualquier secuencia de caracteres no alfanuméricos por un guion.
    .replace(/[^a-zA-Z0-9]+/g, '-')
    // Eliminar guiones al inicio o al final resultantes de los pasos anteriores.
    .replace(/^-+|-+$/g, '')
    // Convertir a minúsculas para unificar.
    .toLowerCase()
  return limpio || fallback
}

/**
 * Dispara la descarga de un archivo en el dispositivo del usuario a partir de contenido en memoria.
 *
 * Crea un Blob, genera una URL temporal y simula el clic sobre un enlace de descarga,
 * limpiando ambos recursos al terminar. Solo funciona en el browser (usa `document`/`URL`).
 *
 * @param contenido Contenido del archivo (texto, ArrayBuffer, etc.).
 * @param nombreArchivo Nombre con el que se descarga (incluí la extensión, p. ej. `'datos.yaml'`).
 * @param tipo MIME type del contenido (p. ej. `'text/yaml;charset=utf-8'`).
 */
export function descargarArchivo(contenido: BlobPart, nombreArchivo: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)

  // Crear un enlace temporal, hacer clic en él para iniciar la descarga y luego eliminarlo.
  const ancla = document.createElement('a')
  ancla.href = url
  ancla.download = nombreArchivo
  document.body.appendChild(ancla)
  ancla.click()
  ancla.remove()

  URL.revokeObjectURL(url)
}

export function exportarPlanilla(datos: any[]) {
  // Crea un nuevo libro de trabajo
  const wb = XLSX.utils.book_new()

  // Convierte los datos a una hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(datos)

  // Ajusta el ancho de las columnas automáticamente
  const maxWidth = 50
  const colWidths = [
    { wch: Math.min(Math.max(...datos.map((d) => d.Nombre.length), 10), maxWidth) },
    { wch: Math.min(Math.max(...datos.map((d) => d.Email.length), 10), maxWidth) },
    { wch: Math.min(Math.max(...datos.map((d) => d.DNI.length), 10), maxWidth) },
    // { wch: 15 }
  ]
  ws['!cols'] = colWidths

  // Añade la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes')

  // Genera nombre de archivo con fecha
  const fecha = new Date().toISOString().split('T')[0]
  const nombreArchivo = `estudiantes_${fecha}.xlsx`

  // Descarga el archivo
  XLSX.writeFile(wb, nombreArchivo)
}

/**
 * Exporta una planilla con columnas definidas explícitamente (a diferencia de `exportarPlanilla`,
 * que infiere las columnas de las claves fijas Nombre/Email/DNI). La usamos cuando el set de
 * columnas es dinámico, como la planilla completa que agrega una columna por pregunta de la sala.
 *
 * @param filas Una fila por estudiante; cada valor se busca por `columnas[].key`.
 * @param columnas Columnas a incluir, en orden, con el encabezado a mostrar.
 * @param nombreArchivo Nombre con el que se descarga (incluí la extensión, p. ej. `'planilla.xlsx'`).
 */
export function exportarPlanillaConColumnas(
  filas: Record<string, string>[],
  columnas: { key: string; header: string }[],
  nombreArchivo: string
) {
  const wb = XLSX.utils.book_new()

  const aoa = [columnas.map((c) => c.header), ...filas.map((fila) => columnas.map((c) => fila[c.key] ?? ''))]
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  const maxWidth = 50
  ws['!cols'] = columnas.map((c) => ({
    wch: Math.min(Math.max(c.header.length, ...filas.map((f) => (f[c.key] ?? '').length), 10), maxWidth),
  }))

  XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes')
  XLSX.writeFile(wb, nombreArchivo)
}

/**
 * Arma y descarga la planilla completa (estado del servidor: incluye desconectados y respuestas por
 * pregunta). Decide las columnas según el método de login de la sala: en sala anónima el id YA es
 * el nombre (columna Nombre redundante); "Nombre provisto" solo aplica a sala por DNI, que es el
 * único método con lista de invitados precargada.
 */
export function exportarPlanillaCompleta(planilla: PlanillaCompleta, config: ConfigSala) {
  const esSalaAnonima = config.metodo_login === MetodosLogin.Nombre
  const esSalaDni = config.metodo_login === MetodosLogin.DNI

  const columnas = [
    { key: 'id', header: 'ID' },
    ...(esSalaAnonima ? [] : [{ key: 'nombre', header: 'Nombre' }]),
    ...(esSalaDni ? [{ key: 'nombreProvisto', header: 'Nombre provisto' }] : []),
    ...planilla.preguntas.map((pregunta) => ({ key: pregunta.id, header: pregunta.pregunta })),
  ]

  const filas = planilla.filas.map((fila) => ({
    id: fila.dni || fila.email || fila.userId,
    nombre: fila.nombre || 'Sin nombre',
    nombreProvisto: fila.nombreProvisto || '',
    ...fila.respuestas,
  }))

  const fecha = new Date().toISOString().split('T')[0]
  exportarPlanillaConColumnas(filas, columnas, `planilla_${aSlug(config.nombre ?? config.nombre_profe)}_${fecha}.xlsx`)
}
