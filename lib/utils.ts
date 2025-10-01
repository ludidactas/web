import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as XLSX from 'xlsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nombreSplit(username: string | null | undefined): string {
  if (!username) return 'Anónimx'
  if (username.includes(' ')) return username.split(' ')[0]
  return username
}

export function exportarPlanilla(datos:any[]){
    // Crea un nuevo libro de trabajo
    const wb = XLSX.utils.book_new()

    // Convierte los datos a una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos)

    // Ajusta el ancho de las columnas automáticamente
    const maxWidth = 50
    const colWidths = [
      { wch: Math.min(Math.max(...datos.map(d => d.Nombre.length), 10), maxWidth) },
      { wch: Math.min(Math.max(...datos.map(d => d.Email.length), 10), maxWidth) },
      { wch: Math.min(Math.max(...datos.map(d => d.DNI.length), 10), maxWidth) },
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