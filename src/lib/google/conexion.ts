const URL_CONECTAR = '/api/google/conectar'
const MENSAJE_CONECTADO = 'drive-conectado'

/**
 * Dispara el consentimiento OAuth de Drive en un popup y resuelve cuando termina.
 *
 * El popup navega a `/api/google/conectar` (que redirige a Google) y, al volver,
 * cae en `/google/conectado`, que llama a `avisarConectado()` para avisarle a esta
 * ventana vía `postMessage` y cerrarse solo. Si el usuario cierra el popup antes
 * (detectado por polling de `popup.closed`), se resuelve `false`.
 *
 * Si el navegador bloquea el popup, se hace fallback a una navegación completa
 * de la ventana actual (en ese caso la promesa nunca resuelve, porque la página
 * se recarga).
 */
export function conectarConDrive(): Promise<boolean> {
  const popup = window.open('about:blank', 'ludidactas-drive', 'width=520,height=680')

  if (!popup) {
    window.location.href = URL_CONECTAR
    return new Promise<boolean>(() => {})
  }

  popup.location.href = URL_CONECTAR

  return new Promise((resolver) => {
    const alRecibir = (evento: MessageEvent) => {
      if (evento.origin !== window.location.origin || evento.data !== MENSAJE_CONECTADO) return
      terminar(true)
    }

    const intervalo = window.setInterval(() => {
      if (popup.closed) terminar(false)
    }, 500)

    const terminar = (conectado: boolean) => {
      window.clearInterval(intervalo)
      window.removeEventListener('message', alRecibir)
      popup.close()
      resolver(conectado)
    }

    window.addEventListener('message', alRecibir)
  })
}

/** Le avisa a la ventana que abrió este popup que la conexión con Drive terminó, y se cierra. */
export function avisarConectado() {
  window.opener?.postMessage(MENSAJE_CONECTADO, window.location.origin)
  window.close()
}
