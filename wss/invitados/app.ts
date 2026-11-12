import { MAX_LEN_NOMBRE, MetodosLogin } from '../validators/auth'
import * as db from './db'
import { claveDeIdentidad, normalizarIdentidad, prepararLista } from './identidad'

/**
 * La lista de una sala: identidades (DNI, email o nombre según su `metodo_login`) con el nombre que el
 * profe le puso a cada una. Guarda las entradas normalizadas (`normalizarIdentidad`) y resuelve la
 * pertenencia por clave (`claveDeIdentidad`), así que `Ana` y `ana` son la misma entrada.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ListaPermitidos {
  export function para(salaId: string, metodo: MetodosLogin) {
    const clave = (valor: string) => claveDeIdentidad(metodo, valor)

    /** La entrada guardada que corresponde a `identidad`, o `undefined` si no figura en la lista. */
    async function buscar(identidad: string) {
      const objetivo = clave(identidad)
      return (await db.obtenerPermitidosDe(salaId)).find((entrada) => clave(entrada) === objetivo)
    }

    async function agregar(valores: string[]) {
      const { lista } = prepararLista(metodo, valores)
      const existentes = new Set((await db.obtenerPermitidosDe(salaId)).map(clave))
      await db.agregarPermitidosA(
        lista.filter((entrada) => !existentes.has(clave(entrada))),
        salaId
      )
    }

    /** Agrega las entradas con su nombre provisto (si lo traen). Valida el lote entero antes de guardar nada. */
    async function agregarConNombres(entradas: { identidad: string; nombre?: string }[]) {
      const nombres = Object.fromEntries(entradas.flatMap((e) => (e.nombre ? [[e.identidad, e.nombre]] : [])))
      const preparado = prepararLista(
        metodo,
        entradas.map((e) => e.identidad),
        nombres
      )
      await agregar(preparado.lista)
      for (const [entrada, nombre] of Object.entries(preparado.nombres)) await setNombre(entrada, nombre)
    }

    async function remover(valores: string[]) {
      const objetivos = new Set(valores.map(clave))
      const aQuitar = (await db.obtenerPermitidosDe(salaId)).filter((entrada) => objetivos.has(clave(entrada)))
      if (aQuitar.length === 0) return
      await db.quitarPermitidosDe(aQuitar, salaId)
      await db.quitarNombresPermitidos(aQuitar, salaId)
    }

    async function setNombre(identidad: string, nombre: string) {
      const entrada = await buscar(normalizarIdentidad(metodo, identidad))
      if (!entrada) throw new Error(`"${identidad}" no está en la lista`)
      const recortado = nombre.trim().slice(0, MAX_LEN_NOMBRE)
      if (!recortado) throw new Error('El nombre no puede estar vacío')
      await db.setNombrePermitido(salaId, entrada, recortado)
    }

    async function nombres() {
      return db.obtenerNombresPermitidos(salaId)
    }

    return {
      obtener: () => db.obtenerPermitidosDe(salaId),
      agregar,
      remover,
      limpiar: async () => {
        await db.limpiarListaPermitidosDe(salaId)
        await db.limpiarNombresPermitidosDe(salaId)
      },
      /** Si `identidad` figura en la lista. */
      incluye: async (identidad: string) => (await buscar(identidad)) !== undefined,

      agregarConNombres,
      /** Asigna el nombre que el profe le dio a una entrada de la lista. Lanza si la entrada no figura. */
      setNombre,
      /** Mapa entrada → nombre provisto. */
      nombres,
      /** El nombre provisto de `identidad`, o `undefined` si no figura en la lista o no tiene. */
      nombreProvistoDe: async (identidad: string) => {
        const entrada = await buscar(identidad)
        return entrada === undefined ? undefined : (await nombres())[entrada]
      },
      /** Lista junto con sus nombres provistos, para hidratar al FE de una sola vez. */
      obtenerConNombres: async () => ({ lista: await db.obtenerPermitidosDe(salaId), nombres: await nombres() }),
    }
  }
}
