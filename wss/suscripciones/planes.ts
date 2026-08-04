import { LimiteSalasAlcanzado } from '../validators/errors'
import * as salaDb from '../salas/db'
import { registradoComoAdmin } from '../middleware/auth'

/**
 * Plan de un profe. Hoy hay un único plan (`gratis`), pero esta es la ÚNICA pieza que conoce los
 * límites: cuando exista el sistema de suscripción, solo hay que cambiar `getPlanDeProfe` para que
 * lea el estado de suscripción (Stripe/MercadoPago, un `suscripciones:<email>` en redis, etc.) y
 * devuelva el plan correspondiente. El resto de la lógica (contar salas, bloquear la creación) no
 * cambia.
 */
export type Plan = {
  id: 'gratis' | 'pro'
  /** Máximo de salas que puede tener el profe. */
  maxSalas: number
}

const PLAN_GRATIS: Plan = { id: 'gratis', maxSalas: 2 }
const PLAN_ADMIN: Plan = { id: 'pro', maxSalas: 100 }

/** Devuelve el plan del profe. Hoy todos están en el plan gratis. */
export function getPlanDeProfe(email: string): Plan {
  void email
  if (registradoComoAdmin(email)) return PLAN_ADMIN
  return PLAN_GRATIS
}

/** Lanza `LimiteSalasAlcanzado` si el profe ya llegó al máximo de salas de su plan. */
export async function assertPuedeCrearSala(email: string): Promise<void> {
  const plan = getPlanDeProfe(email)
  const actuales = (await salaDb.getIdsSalasDeProfe(email)).length
  if (actuales >= plan.maxSalas) throw new LimiteSalasAlcanzado(plan.maxSalas)
}
