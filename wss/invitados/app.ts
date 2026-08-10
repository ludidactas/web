import { SocketConSesion } from '../middleware/session'
import { MetodosLogin, RolSala } from '../validators/auth'
import * as db from './db'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ListaPermitidos {
  async function obtener(salaId: string) {
    return db.obtenerPermitidosDe(salaId)
  }
  async function agregar(list: string[], salaId: string) {
    await db.agregarPermitidosA(list, salaId)
  }

  async function remover(list: string[], salaId: string) {
    await db.quitarPermitidosDe(list, salaId)
    await db.quitarNombresPermitidos(list, salaId)
  }

  async function limpiar(salaId: string) {
    await db.limpiarListaPermitidosDe(salaId)
    await db.limpiarNombresPermitidosDe(salaId)
  }

  async function setNombre(dni: string, nombre: string, salaId: string) {
    await db.setNombrePermitido(salaId, dni, nombre)
  }

  async function nombres(salaId: string) {
    return db.obtenerNombresPermitidos(salaId)
  }

  async function incluye(salaId: string, userId: string) {
    const lista = await obtener(salaId)
    return lista.includes(userId)
  }

  async function purgarSockets(salaId: string, sockets: SocketConSesion[]) {
    const lista = await obtener(salaId)
    // Devolvemos los sockets que no están autorizados (estudiantes cuyo DNI no está en la lista de permitidos)
    return sockets.filter(
      (s) =>
        s.data.session.rol === RolSala.Estudiante &&
        s.data.session.metodo === MetodosLogin.DNI &&
        !lista.includes(s.data.session.userId)
    )
  }

  export function para(salaId: string) {
    return {
      obtener: () => obtener(salaId),
      agregar: (list: string[]) => agregar(list, salaId),
      remover: (list: string[]) => remover(list, salaId),
      limpiar: () => limpiar(salaId),
      incluye: (dni: string) => incluye(salaId, dni),
      purgar: (sockets: SocketConSesion[]) => purgarSockets(salaId, sockets),

      /** Asigna el nombre que el profe le dio a un DNI de la lista de invitados. */
      setNombre: (dni: string, nombre: string) => setNombre(dni, nombre, salaId),
      /** Mapa dni → nombre provisto de los invitados de la sala. */
      nombres: () => nombres(salaId),
      /** Lista de invitados junto con sus nombres provistos, para hidratar al FE de una sola vez. */
      obtenerConNombres: async () => ({ lista: await obtener(salaId), nombres: await nombres(salaId) }),
    }
  }
}
