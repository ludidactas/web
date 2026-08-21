const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file'

export const AUTORIZACION = {
  conDrive: {
    scope: `openid email profile ${SCOPE_DRIVE_FILE}`,
    access_type: 'offline',
    response_type: 'code',
    include_granted_scopes: 'true',
  },
}
