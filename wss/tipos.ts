// Tipos

export interface Encuesta {
  id: string
  pregunta: string
  opciones: Opcion[]
  /** Fecha y hora de creación */
  createdAt: string
  /** Define si está abierta, es decir si recibe votos */
  isOpen: boolean
  /** Define si está publicada, es decir si es visible para lxs estudiantes */
  isPublished: boolean
  /** Define se está enfocada en el overlay */
  isFocused: boolean
  /** Define si los votos y las opciones son visibles en el overlay y la vista de estudiante */
  isRevealed: boolean
  /** Define si una encuesta puede recibir respuestas adicionales a las opciones dadas */
  admiteAportes: boolean
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