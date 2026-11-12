import type { LucideIcon } from 'lucide-react'
import { ClipboardList, DoorOpen, IdCard, Lock, Mail, UserRound } from 'lucide-react'
import { AccesoSala, MetodosLogin } from '@/wss/validators/auth'

/** Cómo se presenta al profe cada opción de identidad y de acceso de una sala. */
export type OpcionSala = { titulo: string; descripcion: string; icono: LucideIcon }

export const OPCIONES_IDENTIDAD: Record<MetodosLogin, OpcionSala> = {
  [MetodosLogin.Nombre]: {
    titulo: 'Nombre',
    descripcion: 'Cada persona elige uno. No se puede repetir en la sala.',
    icono: UserRound,
  },
  [MetodosLogin.DNI]: {
    titulo: 'DNI',
    descripcion: 'Cada persona ingresa su DNI, sin verificarlo.',
    icono: IdCard,
  },
  [MetodosLogin.Google]: {
    titulo: 'Cuenta de Google',
    descripcion: 'Ingresan con su cuenta de Google. El email queda verificado.',
    icono: Mail,
  },
}

export const OPCIONES_ACCESO: Record<AccesoSala, OpcionSala> = {
  [AccesoSala.Libre]: {
    titulo: 'Libre',
    descripcion: 'Entra cualquiera. Se registra quién es.',
    icono: DoorOpen,
  },
  [AccesoSala.Invitados]: {
    titulo: 'Lista de invitadxs',
    descripcion: 'Entra cualquiera. Quienes figuran en tu lista se anotan como invitadxs.',
    icono: ClipboardList,
  },
  [AccesoSala.Lista]: {
    titulo: 'Lista de acceso',
    descripcion: 'Solo entra quien figura en tu lista.',
    icono: Lock,
  },
}

/** Cómo se pide y se muestra cada identidad en la lista de la sala. */
export const IDENTIDAD_EN_LISTA: Record<
  MetodosLogin,
  { etiqueta: string; placeholder: string; inputMode?: 'numeric' | 'email'; etiquetaNombre: string }
> = {
  [MetodosLogin.Nombre]: {
    etiqueta: 'Nombre de ingreso',
    placeholder: 'Con el que va a ingresar',
    etiquetaNombre: 'Nombre real',
  },
  [MetodosLogin.DNI]: { etiqueta: 'DNI', placeholder: 'Ingresar DNI', inputMode: 'numeric', etiquetaNombre: 'Nombre' },
  [MetodosLogin.Google]: {
    etiqueta: 'Email',
    placeholder: 'Ingresar email',
    inputMode: 'email',
    etiquetaNombre: 'Nombre',
  },
}
