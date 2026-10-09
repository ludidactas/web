/** Nombres de los rooms de socket.io: el único lugar donde se arma su formato. */
export const rooms = {
  /** Todas las conexiones de una sala. */
  sala: (idSala: string) => `sala:${idSala}`,
  /** Las conexiones del profe de la sala. */
  profe: (idSala: string) => `sala:${idSala}:profe`,
  estudiantes: (idSala: string) => `sala:${idSala}:estudiantes`,
  publico: (idSala: string) => `sala:${idSala}:publico`,
  overlay: (idSala: string) => `sala:${idSala}:overlay`,
  /** Las conexiones de una persona en la sala (ej. varias pestañas del mismo estudiante). */
  usuario: (idSala: string, userId: string) => `sala:${idSala}:${userId}`,
  /** Todas las conexiones de un profe, en cualquier sala. */
  cuentaProfe: (email: string) => `profe:${email}`,
  /** Los que siguen una partida de Go: sus jugadores y quienes la observan. */
  partidaGo: (idSala: string, partidaId: string) => `sala:${idSala}:go:${partidaId}`,
}
