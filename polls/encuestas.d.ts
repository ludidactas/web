// Setup

export interface Encuesta {
  id: string
  pregunta: string
  opciones: { id: string; texto: string; votos: number }[]
  createdAt: string
  isActive: boolean
  isPublished: boolean
}

export interface EncuestaHidratada extends Encuesta {
  puedoVotar?: boolean
  votoEmitido?: string
}

export interface CrearEncuesta  {
  pregunta: string
  opciones: string[]
  masterPassword: string
}