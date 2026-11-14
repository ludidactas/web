import { z } from 'zod'
import { normalizarTexto } from '../utils'
import { MAX_LEN_DNI, MAX_LEN_NOMBRE, MetodosLogin } from '../validators/auth'
import { infoEntrada, infoVacia, type InfoEntrada } from '../validators/invitados'

/** Cómo se llama la identidad en los mensajes al usuario. */
export const ETIQUETA_IDENTIDAD: Record<MetodosLogin, string> = {
  [MetodosLogin.Nombre]: 'nombre',
  [MetodosLogin.DNI]: 'DNI',
  [MetodosLogin.Google]: 'email',
}

/**
 * Forma de una entrada de la lista según la identidad de la sala: es lo que se guarda en redis.
 * Lanza si el valor no tiene la forma de esa identidad.
 */
export function normalizarIdentidad(metodo: MetodosLogin, valor: string): string {
  const limpio = valor.trim().replace(/\s+/g, ' ')
  switch (metodo) {
    case MetodosLogin.DNI:
      if (!/^\d+$/.test(limpio) || limpio.length > MAX_LEN_DNI) throw new Error(`DNI inválido: "${valor}"`)
      return limpio
    case MetodosLogin.Google:
      if (!z.email().safeParse(limpio).success) throw new Error(`Email inválido: "${valor}"`)
      return limpio.toLowerCase()
    case MetodosLogin.Nombre:
      if (!limpio || limpio.length > MAX_LEN_NOMBRE) throw new Error(`Nombre inválido: "${valor}"`)
      return limpio
  }
}

/**
 * Clave con la que se comparan dos identidades: la de una entrada de la lista contra el `userId` de una
 * sesión. Los nombres se comparan sin tildes ni mayúsculas, igual que el chequeo de nombre en uso.
 */
export function claveDeIdentidad(metodo: MetodosLogin, valor: string): string {
  return metodo === MetodosLogin.Nombre ? normalizarTexto(valor) : valor.trim().toLowerCase()
}

/**
 * Valida y normaliza la lista inicial de una sala, y la info de sus entradas que la acompaña.
 * Lanza con el detalle de las entradas inválidas, sin guardar nada. Las entradas repetidas (por clave)
 * se unifican. Info para algo que no está en la lista es un error.
 */
export function prepararLista(
  metodo: MetodosLogin,
  lista: string[],
  info: Record<string, InfoEntrada> = {}
): { lista: string[]; info: Record<string, InfoEntrada> } {
  const porClave = new Map<string, string>()
  const invalidas: string[] = []
  for (const valor of lista) {
    try {
      const entrada = normalizarIdentidad(metodo, valor)
      const clave = claveDeIdentidad(metodo, entrada)
      if (!porClave.has(clave)) porClave.set(clave, entrada)
    } catch {
      invalidas.push(valor)
    }
  }
  if (invalidas.length > 0) throw new Error(`Entradas inválidas en la lista: ${invalidas.join(', ')}`)

  const infoPorEntrada: Record<string, InfoEntrada> = {}
  for (const [identidad, crudo] of Object.entries(info)) {
    const entrada = porClave.get(claveDeIdentidad(metodo, identidad))
    if (!entrada) throw new Error(`"${identidad}" tiene info pero no está en la lista`)
    const limpia = infoEntrada.parse(crudo)
    if (!infoVacia(limpia)) infoPorEntrada[entrada] = limpia
  }

  return { lista: [...porClave.values()], info: infoPorEntrada }
}

/** La info de `userId` en un mapa entrada → info (como el de `ListaPermitidosConInfo`), o `undefined`. */
export function buscarInfo(
  info: Record<string, InfoEntrada>,
  metodo: MetodosLogin,
  userId: string
): InfoEntrada | undefined {
  const objetivo = claveDeIdentidad(metodo, userId)
  const entrada = Object.keys(info).find((e) => claveDeIdentidad(metodo, e) === objetivo)
  return entrada === undefined ? undefined : info[entrada]
}
