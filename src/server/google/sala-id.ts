/** Ids de sala emitidos por el WSS: 8 hex (anteriores a los ids de 128 bits) y 32 hex. Se
 * interpolan en las queries `appProperties ... value='${salaId}'` de Drive, así que cualquier
 * valor que llegue de la URL se valida contra este formato antes de tocar Google. */
const FORMATO_ID_SALA = /^(?:[0-9a-f]{8}|[0-9a-f]{32})$/

/** True si `salaId` tiene un formato emitido por el WSS. */
export function esSalaIdValido(salaId: string): boolean {
  return FORMATO_ID_SALA.test(salaId)
}
