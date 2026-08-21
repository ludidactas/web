import type { drive_v3 } from '@googleapis/drive'

import type { ColeccionPreguntasEnDrive } from '@/lib/google/recursos-colecciones'
import { aSlug } from '@/lib/utils'

const MIME_CARPETA = 'application/vnd.google-apps.folder'
const MIME_YAML = 'text/plain'
const MEDIA_YAML = `${MIME_YAML}; charset=UTF-8`

type PropiedadesApp = Record<string, string>
type ArchivoDrive = drive_v3.Schema$File & { id: string }
type ArchivoNuevo = drive_v3.Schema$File & { name: string; mimeType: string; appProperties: PropiedadesApp }

type SalaDrive = {
  salaId: string
  nombreSala: string
}

const TERMINO_ADMITIDO = /^[A-Za-z0-9_-]+$/

function validar(termino: string) {
  if (!TERMINO_ADMITIDO.test(termino)) {
    throw new Error(`Término no admitido en una consulta a Drive: ${termino}`)
  }
  return termino
}

function condicionPropiedades(propiedades: PropiedadesApp) {
  return Object.entries(propiedades)
    .map(([clave, valor]) => `appProperties has { key='${validar(clave)}' and value='${validar(valor)}' }`)
    .join(' and ')
}

async function listarArchivos(api: drive_v3.Drive, propiedades: PropiedadesApp, mimeType: string) {
  const q = `${condicionPropiedades(propiedades)} and mimeType='${mimeType}' and trashed=false`
  const archivos: ArchivoDrive[] = []
  let pageToken: string | undefined

  do {
    const { data } = await api.files.list({
      q,
      fields: 'nextPageToken,files(id,name)',
      pageSize: 100,
      pageToken,
    })

    archivos.push(...((data.files ?? []) as ArchivoDrive[]))
    pageToken = data.nextPageToken ?? undefined
  } while (pageToken)

  return archivos
}

async function buscarArchivo(api: drive_v3.Drive, propiedades: PropiedadesApp, mimeType: string) {
  const [primero] = await listarArchivos(api, propiedades, mimeType)
  return primero ?? null
}

async function buscarOCrear(api: drive_v3.Drive, datos: ArchivoNuevo) {
  const encontrado = await buscarArchivo(api, datos.appProperties, datos.mimeType)
  if (encontrado) return encontrado

  const { data } = await api.files.create({ fields: 'id,name', requestBody: datos })
  if (!data.id) throw new Error(`Drive no devolvió un id al crear ${datos.name}`)

  return data as ArchivoDrive
}

function propiedadesCarpeta(salaId: string, recurso: 'sala' | 'colecciones') {
  return { ludidactasSala: salaId, recurso }
}

async function carpetaDeColecciones(api: drive_v3.Drive, sala: SalaDrive) {
  const raiz = await buscarOCrear(api, {
    name: 'Ludidactas',
    mimeType: MIME_CARPETA,
    appProperties: { ludidactas: 'raiz' },
  })

  const carpetaSala = await buscarOCrear(api, {
    name: `Sala - ${sala.nombreSala}`,
    mimeType: MIME_CARPETA,
    appProperties: propiedadesCarpeta(sala.salaId, 'sala'),
    parents: [raiz.id],
  })

  return buscarOCrear(api, {
    name: 'Colecciones',
    mimeType: MIME_CARPETA,
    appProperties: propiedadesCarpeta(sala.salaId, 'colecciones'),
    parents: [carpetaSala.id],
  })
}

function propiedadesDeSala(salaId: string) {
  return { ludidactasSala: salaId, recurso: 'coleccion' }
}

function propiedadesColeccion(salaId: string, nombre: string) {
  return { ...propiedadesDeSala(salaId), coleccion: aSlug(nombre) }
}

export async function leerColecciones(api: drive_v3.Drive, salaId: string): Promise<ColeccionPreguntasEnDrive[]> {
  const archivos = await listarArchivos(api, propiedadesDeSala(salaId), MIME_YAML)

  return Promise.all(
    archivos.map(async (archivo) => {
      const { data } = await api.files.get({ fileId: archivo.id, alt: 'media' }, { responseType: 'text' })
      return { archivo: archivo.name ?? '', contenido: data as unknown as string }
    })
  )
}

export async function guardarColeccion(api: drive_v3.Drive, sala: SalaDrive, nombre: string, contenido: string) {
  const propiedades = propiedadesColeccion(sala.salaId, nombre)
  const existente = await buscarArchivo(api, propiedades, MIME_YAML)
  const media = { mimeType: MEDIA_YAML, body: contenido }

  if (existente) {
    await api.files.update({ fileId: existente.id, media })
    return
  }

  const colecciones = await carpetaDeColecciones(api, sala)

  await api.files.create({
    requestBody: {
      name: `${aSlug(nombre)}.yaml`,
      mimeType: MIME_YAML,
      appProperties: propiedades,
      parents: [colecciones.id],
    },
    media,
  })
}
