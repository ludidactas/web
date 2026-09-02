// `drive.file`: acceso solo a los archivos que la app crea/abre, no a todo el Drive del usuario.
const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file'

/**
 * Parámetros de autorización OAuth para pedirle a Google, además del login,
 * permiso para operar sobre Drive.
 *
 * `access_type: 'offline'` es lo que hace que Google devuelva un `refresh_token`
 * (si no, solo se obtiene un access_token de corta duración). Ese refresh_token
 * es lo que persiste `auth.ts` en el JWT para armar el cliente de Drive server-side.
 */
export const AUTORIZACION = {
  conDrive: {
    scope: `openid email profile ${SCOPE_DRIVE_FILE}`,
    access_type: 'offline',
    response_type: 'code',
    include_granted_scopes: 'true',
  },
}
