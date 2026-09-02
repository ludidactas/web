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

/**
 * Verifica que un valor sea seguro para interpolar en el string de query (`q`) de la
 * Drive API, que no soporta parámetros bindeados. Cualquier valor que llegue de afuera
 * (salaId, nombre de colección) pasa por acá antes de terminar en la query.
 */
function validar(termino: string) {
  if (!TERMINO_ADMITIDO.test(termino)) {
    throw new Error(`Término no admitido en una consulta a Drive: ${termino}`)
  }
  return termino
}

/** Arma la cláusula `q` que matchea archivos por sus `appProperties` (los metadatos custom que usamos para "taggear" carpetas/archivos con la sala/colección a la que pertenecen). */
function condicionPropiedades(propiedades: PropiedadesApp) {
  return Object.entries(propiedades)
    .map(([clave, valor]) => `appProperties has { key='${validar(clave)}' and value='${validar(valor)}' }`)
    .join(' and ')
}

/** Pagina sobre `files.list` hasta agotar `nextPageToken` y devuelve todos los archivos que matchean. */
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

/** Como `listarArchivos`, pero se queda con el primer resultado (asume que las `propiedades` identifican a lo sumo un archivo). */
async function buscarArchivo(api: drive_v3.Drive, propiedades: PropiedadesApp, mimeType: string) {
  const [primero] = await listarArchivos(api, propiedades, mimeType)
  return primero ?? null
}

/** Idempotente: si ya existe un archivo con esas `appProperties` lo devuelve, si no lo crea. */
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

/**
 * Encuentra (creando lo que falte) la carpeta `Ludidactas/Sala - {nombre}/Colecciones`
 * de `salaId` en el Drive del usuario autenticado. La jerarquía completa se busca/crea
 * de a un nivel por `appProperties`, no por nombre, para tolerar que el usuario la
 * renombre a mano sin romper las búsquedas futuras.
 */
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

/**
 * Trae el contenido de todas las colecciones de preguntas (YAML) guardadas en Drive
 * para `salaId`. No verifica que `salaId` pertenezca al usuario autenticado: opera
 * sobre lo que encuentre taggeado con ese id en el Drive del caller.
 */
export async function leerColecciones(api: drive_v3.Drive, salaId: string): Promise<ColeccionPreguntasEnDrive[]> {
  const archivos = await listarArchivos(api, propiedadesDeSala(salaId), MIME_YAML)

  return Promise.all(
    archivos.map(async (archivo) => {
      const { data } = await api.files.get({ fileId: archivo.id, alt: 'media' }, { responseType: 'text' })
      return { archivo: archivo.name ?? '', contenido: data as unknown as string }
    })
  )
}

/**
 * Guarda `contenido` como una colección de preguntas en Drive, identificada por
 * `salaId` + slug de `nombre` vía `appProperties`. Si ya existe una colección con ese
 * nombre (mismo slug) la sobrescribe en lugar de duplicarla; si no, crea la carpeta
 * `Ludidactas/Sala - {nombreSala}/Colecciones` (si hace falta) y el archivo ahí.
 */
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
