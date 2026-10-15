/**
 * Eventos de uso hacia Google Tag Manager. Cada evento se empuja al `dataLayer`; en GTM, un disparador
 * "Evento personalizado" con el nombre del evento lo reenvía a GA4. Los eventos que se emiten antes de
 * que cargue GTM quedan en la cola y se procesan al cargar. Los parámetros no llevan datos personales.
 */

type Origen = 'tablero' | 'online'

export type EventoAnalytics =
  | { event: 'go_partida_iniciada'; origen: Origen; modo: string; tamano: number }
  | { event: 'go_partida_terminada'; origen: Origen; modo: string; tamano: number; motivo?: string }
  | { event: 'go_dojo_ejercicio'; desafio_id: string; tipo: string; correcto: boolean }
  | { event: 'sala_creada'; metodo_login: string; solo_invitados: boolean }
  | { event: 'sala_acceso_estudiante'; metodo_login?: string }
  | { event: 'encuesta_pregunta_creada'; opciones: number; admite_aportes: boolean; admite_multiples_votos: boolean }
  | { event: 'encuesta_coleccion_exportada'; destino: 'archivo' | 'drive'; preguntas: number }
  | {
      event: 'encuesta_coleccion_importada'
      origen: 'archivo' | 'url' | 'ejemplo' | 'drive'
      creadas: number
      omitidas: number
      con_errores: boolean
    }
  | { event: 'encuesta_respuesta_enviada'; tipo: 'opcion' | 'aporte' | 'ambos'; opciones: number }

export function track(evento: EventoAnalytics) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { dataLayer?: unknown[] }
  ;(w.dataLayer ??= []).push(evento)
}
