export interface ProgresoGuardado {
  resueltos: string[]
  /** Id del último desafío que el estudiante tenía abierto. */
  actual: string | null
}

/**
 * Une el progreso local con el remoto de un capítulo. Resolver es lo único que modifica `resueltos`, así
 * que la unión nunca pierde nada; el `actual` remoto gana y el local queda de respaldo.
 */
export function fusionarProgreso(local: ProgresoGuardado, remoto: ProgresoGuardado): ProgresoGuardado {
  return {
    resueltos: [...new Set([...local.resueltos, ...remoto.resueltos])],
    actual: remoto.actual ?? local.actual,
  }
}
