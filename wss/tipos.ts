// Tipos

export interface Encuesta {
  id: string
  pregunta: string
  opciones: { id: string; texto: string; votos: number }[]
  createdAt: string
  isOpen: boolean
  isPublished: boolean
}

export interface EncuestaHidratada extends Encuesta {
  puedoVotar?: boolean
  votoEmitido?: string
}

export interface CrearEncuesta  {
  pregunta: string
  opciones: string[]
}

export enum RolEncuesta {
  Admin = 'admin',
  Profe = 'profe',
  Estudiante = 'estudiante',
  Tester = 'tester',
  Publico = 'publico',
}