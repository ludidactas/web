const URL_CONECTAR = '/api/google/conectar'
const MENSAJE_CONECTADO = 'drive-conectado'

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

export function avisarConectado() {
  window.opener?.postMessage(MENSAJE_CONECTADO, window.location.origin)
  window.close()
}
