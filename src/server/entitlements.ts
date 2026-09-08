// A modificar a criterio y discreción.
/** Gate de feature flag: si este email puede usar la integración con Google Drive. Placeholder: hoy habilita a todos. */
export async function tieneIntegracionGoogle(_email: string | null | undefined) {
  return true
}
