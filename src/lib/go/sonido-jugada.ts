const SONIDO_JUGADA = '/sfx/jugada_go.m4a'

/**
 * Sonido de una piedra que entra al tablero (partida en vivo, tablero local y dojo).
 *
 * Se descarga y decodifica una vez, al importar el módulo, y cada `sonarJugada` solo dispara ese buffer
 * por Web Audio: sin carga ni decodificación en el momento del click, que es lo que demora el arranque
 * de un `HTMLAudioElement`. Se decodifica con un `OfflineAudioContext`, que no exige gesto del usuario.
 * El `AudioContext` de reproducción tarda en crearse, así que se prepara en el primer toque sobre la
 * página (que además es el gesto que el navegador pide para dejarlo sonar), antes del primer sonido.
 */

let buffer: AudioBuffer | null = null
let contexto: AudioContext | null = null

if (typeof window !== 'undefined' && typeof OfflineAudioContext !== 'undefined') {
  fetch(SONIDO_JUGADA)
    .then((r) => r.arrayBuffer())
    .then((datos) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(datos))
    .then((decodificado) => (buffer = decodificado))
    .catch(() => {}) // sin buffer, `sonarJugada` no suena: el juego no depende del sonido
}

function prepararContexto() {
  if (typeof AudioContext === 'undefined') return
  try {
    contexto ??= new AudioContext()
    if (contexto.state === 'suspended') void contexto.resume()
  } catch {}
}

if (typeof window !== 'undefined')
  window.addEventListener('pointerdown', prepararContexto, { once: true, capture: true })

export function sonarJugada() {
  if (!buffer) return
  prepararContexto()
  if (!contexto) return
  try {
    const fuente = contexto.createBufferSource()
    fuente.buffer = buffer
    fuente.connect(contexto.destination)
    fuente.start()
  } catch {}
}
