// Setup

export interface Encuesta {
  id: string
  pregunta: string
  opciones: { id: string; texto: string; votos: number }[]
  createdAt: string
  isActive: boolean
}

export interface CrearEncuesta extends Omit<Encuesta, 'opciones'> {
  opciones: string[]
  masterPassword: string
}