/**
 * Mutex en memoria por clave: serializa operaciones que comparten un recurso mutable persistido en
 * Redis (get → mutar → set) para que dos comandos casi simultáneos sobre la misma clave no se pisen
 * uno al otro. Alcanza porque el wss corre en un solo proceso (sin adapter de Redis para socket.io ni
 * réplicas, ver `wss/mount.ts`); si algún día se escala a varias instancias, esto deja de alcanzar y
 * hace falta un lock distribuido (ej. WATCH/MULTI de Redis).
 */
const colas = new Map<string, Promise<unknown>>()

export function conLock<T>(clave: string, fn: () => Promise<T>): Promise<T> {
  const previa = colas.get(clave) ?? Promise.resolve()
  const propia = previa.then(fn, fn)
  const cola = propia.catch(() => {})
  colas.set(clave, cola)
  cola.finally(() => {
    if (colas.get(clave) === cola) colas.delete(clave)
  })
  return propia
}
