import { pedirGoogle } from './comun'

/** Manda a guardar en Drive la imagen PNG de una partida de Go terminada. */
export async function guardarPartidaEnDrive(
  salaId: string,
  nombreSala: string,
  partidaId: string,
  nombre: string,
  png: Blob
) {
  const form = new FormData()
  form.append('nombreSala', nombreSala)
  form.append('partidaId', partidaId)
  form.append('nombre', nombre)
  form.append('imagen', png)

  await pedirGoogle(`/api/google/salas/${encodeURIComponent(salaId)}/partidas`, {
    method: 'POST',
    body: form,
  })
}
