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

  export function para(salaID: string) {
    return {
      obtener: () => obtener(salaID),
      agregar: (list: string[]) => agregar(list, salaID),
      remover: (list: string[]) => remover(list, salaID),
      limpiar: () => limpiar(salaID),
    }
  }
}
