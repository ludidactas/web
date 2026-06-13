import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import * as db from './db'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ListaPermitidos {
  async function obtener(salaID: string) {
    return db.getAllowedParticipantsListFrom(salaID)
  }
  async function agregar(list: string[], salaID: string) {
    await db.addAllowedParticipants(list, salaID)
  }

  async function remover(list: string[], salaID: string) {
    await db.removeAllowedParticipants(list, salaID)
  }

  async function limpiar(salaID: string) {
    await db.removeAllowedParticipantsListFrom(salaID)
  }

  async function autorizar(salaID: string, dni: string) {
    const lista = await obtener(salaID)
    if (!lista.includes(dni))
      throw new ErrorSesion(
        TipoErrorSesion.DniNoPermitido,
        `El DNI ${dni} no está en la lista de participantes permitidos.`
      )
  }

  export function para(salaID: string) {
    return {
      obtener: () => obtener(salaID),
      agregar: (list: string[]) => agregar(list, salaID),
      remover: (list: string[]) => remover(list, salaID),
      limpiar: () => limpiar(salaID),
      autorizar: (dni: string) => autorizar(salaID, dni),
    }
  }
}
