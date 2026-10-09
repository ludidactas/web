const SONIDO_JUGADA = '/sfx/jugada_go.m4a'

let audio: HTMLAudioElement | null = null

/** Reproduce el sonido de una piedra que entra al tablero (partida en vivo y dojo). */
export function sonarJugada() {
  if (typeof Audio === 'undefined') return
  try {
    audio ??= new Audio(SONIDO_JUGADA)
    audio.currentTime = 0
    // El navegador puede rechazar la reproducción hasta que haya interacción: no es un error del juego.
    audio.play()?.catch(() => {})
  } catch {}
}
