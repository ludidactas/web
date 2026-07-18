// Única fuente que resuelve el entorno. El resto de la app importa `config`.
// dev = `next dev` (NODE_ENV=development); build/deploy = producción.

const esDesarrollo = process.env.NODE_ENV === 'development'

// Dev cae a localhost; en deploy el host lo exige el env o revienta al buildear.
const encuestaHost =
  process.env.NEXT_PUBLIC_ENCUESTA_HOST ?? (esDesarrollo ? 'http://localhost:3005' : undefined)
if (!encuestaHost) {
  throw new Error('Falta NEXT_PUBLIC_ENCUESTA_HOST')
}

export const config = { esDesarrollo, encuestaHost }
