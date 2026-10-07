import type { drive_v3 } from '@googleapis/drive'
import type { sheets_v4 } from '@googleapis/sheets'

import { clientesGoogle } from '@/server/google/cliente'
import type { AsistenciaDeClase } from '@/wss/validators/asistencia'

function labelDeClase(inicio: number, fin: number): string {
  const fi = new Date(inicio)
  const ff = new Date(fin)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fecha = `${pad(fi.getDate())}/${pad(fi.getMonth() + 1)}`
  const horaInicio = `${pad(fi.getHours())}:${pad(fi.getMinutes())}`
  const horaFin = `${pad(ff.getHours())}:${pad(ff.getMinutes())}`
  return `${fecha} ${horaInicio}–${horaFin}`
}

async function buscarSpreadsheet(driveApi: drive_v3.Drive, salaId: string): Promise<string | null> {
  const q = `appProperties has { key='ludidactasSala' and value='${salaId}' } and appProperties has { key='recurso' and value='asistencia' } and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  const { data } = await driveApi.files.list({ q, fields: 'files(id)', pageSize: 1 })
  return data.files?.[0]?.id ?? null
}

async function buscarCarpetaSala(driveApi: drive_v3.Drive, salaId: string): Promise<string | null> {
  const q = `appProperties has { key='ludidactasSala' and value='${salaId}' } and appProperties has { key='recurso' and value='sala' } and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const { data } = await driveApi.files.list({ q, fields: 'files(id)', pageSize: 1 })
  return data.files?.[0]?.id ?? null
}

async function crearSpreadsheet(
  sheetsApi: sheets_v4.Sheets,
  driveApi: drive_v3.Drive,
  salaId: string,
  nombreSala: string
): Promise<string> {
  const { data } = await sheetsApi.spreadsheets.create({
    requestBody: {
      properties: { title: `Asistencia - ${nombreSala}` },
      sheets: [{ properties: { title: 'Asistencia' } }],
    },
  })

  const spreadsheetId = data.spreadsheetId!

  const carpetaSala = await buscarCarpetaSala(driveApi, salaId)
  if (carpetaSala) {
    await driveApi.files.update({
      fileId: spreadsheetId,
      addParents: carpetaSala,
      fields: 'id',
    })
  }

  await driveApi.files.update({
    fileId: spreadsheetId,
    requestBody: {
      appProperties: { ludidactasSala: salaId, recurso: 'asistencia' },
    },
  })

  return spreadsheetId
}

export async function escribirAsistencia(
  request: Request,
  salaId: string,
  nombreSala: string,
  asistencias: AsistenciaDeClase[]
) {
  const { sheets: sheetsApi, drive: driveApi } = await clientesGoogle(request)

  let spreadsheetId = await buscarSpreadsheet(driveApi, salaId)

  if (!spreadsheetId) {
    spreadsheetId = await crearSpreadsheet(sheetsApi, driveApi, salaId, nombreSala)
  }

  const { data: spreadsheet } = await sheetsApi.spreadsheets.get({
    spreadsheetId,
    includeGridData: true,
    ranges: ['Asistencia'],
  })

  const hoja = spreadsheet.sheets?.[0]?.data?.[0]
  const filasExistentes = hoja?.rowData?.length ?? 0
  const columnasExistentes = hoja?.rowData?.[0]?.values?.length ?? 0

  const todosLosUserIds = new Set<string>()
  for (const asistencia of asistencias) {
    for (const est of asistencia.estudiantes) todosLosUserIds.add(est.userId)
  }

  if (filasExistentes > 1) {
    const rowData = hoja!.rowData!
    for (let i = 1; i < rowData.length; i++) {
      const userId = rowData[i].values?.[0]?.formattedValue
      if (userId) todosLosUserIds.add(userId)
    }
  }

  const userIds = [...todosLosUserIds]
  const nombresMap = new Map<string, string>()
  for (const asistencia of asistencias) {
    for (const est of asistencia.estudiantes) {
      if (!nombresMap.has(est.userId)) nombresMap.set(est.userId, est.nombre)
    }
  }

  if (filasExistentes > 1) {
    const rowData = hoja!.rowData!
    for (let i = 1; i < rowData.length; i++) {
      const userId = rowData[i].values?.[0]?.formattedValue
      const nombre = rowData[i].values?.[1]?.formattedValue
      if (userId && nombre && !nombresMap.has(userId)) nombresMap.set(userId, nombre)
    }
  }

  const fechasExistentes: string[] = []
  const presenciaExistente = new Map<string, Map<string, boolean>>()

  if (filasExistentes > 1 && columnasExistentes > 2) {
    const headerRow = hoja!.rowData![0].values!
    for (let col = 2; col < columnasExistentes - 1; col++) {
      const fecha = headerRow[col]?.formattedValue
      if (fecha) fechasExistentes.push(fecha)
    }

    const rowData = hoja!.rowData!
    for (let i = 1; i < rowData.length; i++) {
      const userId = rowData[i].values?.[0]?.formattedValue
      if (!userId) continue
      const presencias = new Map<string, boolean>()
      for (let col = 2; col < columnasExistentes - 1; col++) {
        const fecha = headerRow[col]?.formattedValue
        const valor = rowData[i].values?.[col]?.formattedValue
        if (fecha && valor) presencias.set(fecha, valor === 'P')
      }
      presenciaExistente.set(userId, presencias)
    }
  }

  for (const asistencia of asistencias) {
    const label = labelDeClase(asistencia.inicio, asistencia.fin)
    if (!fechasExistentes.includes(label)) {
      fechasExistentes.push(label)
    }
    for (const est of asistencia.estudiantes) {
      let presencias = presenciaExistente.get(est.userId)
      if (!presencias) {
        presencias = new Map()
        presenciaExistente.set(est.userId, presencias)
      }
      presencias.set(label, est.presente)
    }
  }

  const todasLasFechas = fechasExistentes
  const header = ['ID', 'Nombre', ...todasLasFechas, '% Asistencia']

  const filas = userIds.map((userId) => {
    const presencias = presenciaExistente.get(userId) ?? new Map()
    const valores = todasLasFechas.map((f) => {
      const p = presencias.get(f)
      return p === undefined ? '' : p ? 'P' : 'A'
    })
    const total = valores.filter((v) => v !== '').length
    const presentes = valores.filter((v) => v === 'P').length
    const porcentaje = total > 0 ? `${Math.round((presentes / total) * 100)}%` : ''

    return [userId, nombresMap.get(userId) ?? userId, ...valores, porcentaje]
  })

  const values = [header, ...filas]

  await sheetsApi.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Asistencia',
  })

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: 'Asistencia!A1',
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}
