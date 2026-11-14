import { MetodosLogin } from '../validators/auth'
import { infoEntrada, infoVacia, type InfoEntrada } from '../validators/invitados'
import * as db from './db'
import { claveDeIdentidad, normalizarIdentidad, prepararLista } from './identidad'

/**
 * La lista de una sala: identidades (DNI, email o nombre según su `metodo_login`) con la info que el
 * profe anotó de cada una. Guarda las entradas normalizadas (`normalizarIdentidad`) y resuelve la
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

    /** Agrega las entradas con su info (si la traen). Valida el lote entero antes de guardar nada. */
    async function agregarConInfo(entradas: { identidad: string; info?: InfoEntrada }[]) {
      const info = Object.fromEntries(entradas.flatMap((e) => (e.info ? [[e.identidad, e.info]] : [])))
      const preparado = prepararLista(
        metodo,
        entradas.map((e) => e.identidad),
        info
      )
      await agregar(preparado.lista)
      for (const [entrada, infoDeEntrada] of Object.entries(preparado.info)) await setInfo(entrada, infoDeEntrada)
    }

    async function remover(valores: string[]) {
      const objetivos = new Set(valores.map(clave))
      const aQuitar = (await db.obtenerPermitidosDe(salaId)).filter((entrada) => objetivos.has(clave(entrada)))
      if (aQuitar.length === 0) return
      await db.quitarPermitidosDe(aQuitar, salaId)
      await db.quitarInfoPermitidos(aQuitar, salaId)
    }

    async function setInfo(identidad: string, info: InfoEntrada) {
      const entrada = await buscar(normalizarIdentidad(metodo, identidad))
      if (!entrada) throw new Error(`"${identidad}" no está en la lista`)
      const limpia = infoEntrada.parse(info)
      if (infoVacia(limpia)) await db.quitarInfoPermitidos([entrada], salaId)
      else await db.setInfoPermitido(salaId, entrada, limpia)
    }

    async function infoDeLaLista() {
      return db.obtenerInfoPermitidos(salaId)
    }

    return {
      obtener: () => db.obtenerPermitidosDe(salaId),
      agregar,
      remover,
      limpiar: async () => {
        await db.limpiarListaPermitidosDe(salaId)
        await db.limpiarInfoPermitidosDe(salaId)
      },
      /** Si `identidad` figura en la lista. */
      incluye: async (identidad: string) => (await buscar(identidad)) !== undefined,

      agregarConInfo,
      /** Reemplaza la info de una entrada de la lista (vacía la deja sin anotaciones). Lanza si la entrada no figura. */
      setInfo,
      /** Mapa entrada → info. */
      info: infoDeLaLista,
      /** La info de `identidad`, o `undefined` si no figura en la lista o no tiene. */
      infoDe: async (identidad: string) => {
        const entrada = await buscar(identidad)
        return entrada === undefined ? undefined : (await infoDeLaLista())[entrada]
      },
      /** Lista junto con la info de sus entradas, para hidratar al FE de una sola vez. */
      obtenerConInfo: async () => ({ lista: await db.obtenerPermitidosDe(salaId), info: await infoDeLaLista() }),
    }
  }
}
