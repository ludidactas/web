import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

export interface Desafio {
  numero: number
  nombre: string
  descripcion: string
  imagenUrl: string
  previewUrl: string
  pistas: string[]
  solucionUrl: string
}

export function getDesafios(): Desafio[] {
  const filePath = path.join(process.cwd(), 'src/app/(sitio)/desafios/desafios.yaml')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = parse(raw) as { desafios: Desafio[] }
  return parsed.desafios
}
