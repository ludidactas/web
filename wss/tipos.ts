// Tipos

export interface Encuesta {
  id: string
  pregunta: string
  opciones: Opcion[]
  createdAt: string
  isOpen: boolean
  isPublished: boolean
  isFocused: boolean
  isRevealed: boolean
}

export interface Opcion {
  id: string
  texto: string
  votos: number
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