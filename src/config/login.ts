// Perfil de login. Solo para código server: no importar desde componentes cliente.
import { config } from './entorno'

interface PerfilLogin {
  provider: string
  credenciales?: Record<string, string>
}

export const perfilLogin: PerfilLogin = config.esDesarrollo ? { provider: 'idp-dev' } : { provider: 'google' }
