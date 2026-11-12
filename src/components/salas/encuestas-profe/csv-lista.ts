import { normalizarIdentidad } from '@/wss/invitados/identidad'
import { MetodosLogin } from '@/wss/validators/auth'

export type EntradaLista = { identidad: string; nombre?: string }

/** Resultado de leer un CSV: las entradas válidas y las filas que se descartaron por no tener la forma de la identidad. */
export type LecturaCSV = { entradas: EntradaLista[]; descartadas: string[] }

/** Encabezados que reconoce cada identidad: la columna de la entrada y la del nombre provisto. */
const ENCABEZADOS: Record<MetodosLogin, { identidad: string[]; nombre: string[] }> = {
  [MetodosLogin.Nombre]: { identidad: ['nombre', 'nombre de ingreso'], nombre: ['nombre real', 'nombre provisto'] },
  [MetodosLogin.DNI]: { identidad: ['dni'], nombre: ['nombre', 'nombre provisto'] },
  [MetodosLogin.Google]: { identidad: ['email', 'mail', 'correo'], nombre: ['nombre', 'nombre provisto'] },
}

/** La entrada tal como la guarda el server, o `null` si no tiene la forma de la identidad. */
export function entradaValida(metodo: MetodosLogin, valor: string): string | null {
  try {
    return normalizarIdentidad(metodo, metodo === MetodosLogin.DNI ? valor.replace(/\D/g, '') : valor)
  } catch {
    return null
  }
}

/**
 * Lee un CSV con una columna de identidad (según la sala) y otra de nombre provisto, en cualquier orden.
 * Detecta el encabezado y acepta `,` y `;` como separador. Sin encabezado, la primera columna es la
 * identidad y la segunda el nombre.
 */
export function parsearCSV(texto: string, metodo: MetodosLogin): LecturaCSV {
  const filas = texto
    .split(/\r?\n/)
    .filter((linea) => linea.trim())
    .map((linea) => {
      const delimitador = linea.includes(';') && !linea.includes(',') ? ';' : ','
      return linea.split(delimitador).map((celda) => celda.trim())
    })
  if (filas.length === 0) return { entradas: [], descartadas: [] }

  const [primera] = filas
  const encabezados = ENCABEZADOS[metodo]
  const buscar = (nombres: string[]) => primera.findIndex((celda) => nombres.includes(celda.toLowerCase()))
  const idxIdentidad = buscar(encabezados.identidad)
  const idxNombre = buscar(encabezados.nombre)
  const tieneEncabezado = idxIdentidad !== -1 || idxNombre !== -1

  const colIdentidad = idxIdentidad !== -1 ? idxIdentidad : idxNombre === 0 ? 1 : 0
  const colNombre = idxNombre !== -1 ? idxNombre : colIdentidad === 0 && primera.length > 1 ? 1 : -1

  const entradas: EntradaLista[] = []
  const descartadas: string[] = []
  for (const celdas of tieneEncabezado ? filas.slice(1) : filas) {
    const crudo = celdas[colIdentidad] ?? ''
    const identidad = entradaValida(metodo, crudo)
    if (identidad === null) {
      if (crudo) descartadas.push(crudo)
      continue
    }
    entradas.push({ identidad, nombre: colNombre !== -1 ? celdas[colNombre]?.trim() || undefined : undefined })
  }
  return { entradas, descartadas }
}
