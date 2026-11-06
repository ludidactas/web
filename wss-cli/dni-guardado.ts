const PREFIJO = 'encuestas-dni-'
const DURACION_MS = 24 * 60 * 60 * 1000

/** Guarda el DNI con vencimiento a 24 h. Solo `guardarDni` fija el plazo; leer no lo renueva. */
export function guardarDni(idSala: string, dni: string) {
  try {
    localStorage.setItem(PREFIJO + idSala, JSON.stringify({ dni, expira: Date.now() + DURACION_MS }))
  } catch {}
}

/** Devuelve el DNI vigente; si venció o el valor es inválido, lo borra y devuelve `null`. */
export function leerDni(idSala: string): string | null {
  try {
    const clave = PREFIJO + idSala
    const dni = dniVigente(localStorage.getItem(clave))
    if (dni === null) localStorage.removeItem(clave)
    return dni
  } catch {
    return null
  }
}

export function borrarDni(idSala: string) {
  try {
    localStorage.removeItem(PREFIJO + idSala)
  } catch {}
}

/** `localStorage` no vence solo: borra los DNIs vencidos o inválidos de todas las salas. */
export function limpiarDnisVencidos() {
  try {
    const claves = Object.keys(localStorage).filter((c) => c.startsWith(PREFIJO))
    for (const clave of claves) {
      if (dniVigente(localStorage.getItem(clave)) === null) localStorage.removeItem(clave)
    }
  } catch {}
}

function dniVigente(valor: string | null): string | null {
  if (!valor) return null
  try {
    const { dni, expira } = JSON.parse(valor)
    return typeof dni === 'string' && dni && typeof expira === 'number' && expira > Date.now() ? dni : null
  } catch {
    return null
  }
}
