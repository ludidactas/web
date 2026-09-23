import { describe, it, expect, mock } from 'bun:test'

let sheetsApi: any
let driveApi: any

mock.module('@/server/google/cliente', () => ({
  clientesGoogle: async () => ({ sheets: sheetsApi, drive: driveApi }),
}))

import { escribirAsistencia } from '../sheets-asistencia'

const MIN = 60_000

function labelLocal(inicio: number, fin: number): string {
  const fi = new Date(inicio)
  const ff = new Date(fin)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(fi.getDate())}/${pad(fi.getMonth() + 1)} ${pad(fi.getHours())}:${pad(fi.getMinutes())}–${pad(ff.getHours())}:${pad(ff.getMinutes())}`
}

function row(...cells: string[]) {
  return { values: cells.map((c) => ({ formattedValue: c })) }
}

function sheetVacio() {
  return { data: { sheets: [{ data: [{ rowData: [row('ID', 'Nombre')] }] }] } }
}

describe('escribirAsistencia — planilla nueva', () => {
  it('escribe la matriz correcta (header, P/A y porcentaje)', async () => {
    const updates: any[] = []
    sheetsApi = {
      spreadsheets: {
        create: mock(async () => ({ data: { spreadsheetId: 'spreadsheet-1' } })),
        get: mock(async () => sheetVacio()),
        values: {
          clear: mock(async () => ({})),
          update: mock(async (params: any) => {
            updates.push(params)
            return {}
          }),
        },
      },
    }
    driveApi = {
      files: {
        list: mock(async () => ({ data: { files: [] } })),
        update: mock(async () => ({})),
      },
    }

    const inicio = 1_760_000_000_000
    const fin = inicio + 60 * MIN
    const asistencias = [
      {
        inicio,
        fin,
        estudiantes: [
          { userId: 'u1', nombre: 'Juan', presente: true },
          { userId: 'u2', nombre: 'María', presente: false },
        ],
      },
    ]

    await escribirAsistencia(new Request('http://x'), 'sala-1', 'Mi Sala', asistencias)

    const label = labelLocal(inicio, fin)
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ spreadsheetId: 'spreadsheet-1', range: 'Asistencia!A1', valueInputOption: 'RAW' })
    expect(updates[0].requestBody.values).toEqual([
      ['ID', 'Nombre', label, '% Asistencia'],
      ['u1', 'Juan', 'P', '100%'],
      ['u2', 'María', 'A', '0%'],
    ])
  })
})

describe('escribirAsistencia — merge con planilla existente', () => {
  it('preserva estudiantes y fechas previas y agrega la clase nueva', async () => {
    const inicioVieja = 1_760_000_000_000
    const finVieja = inicioVieja + 60 * MIN
    const labelVieja = labelLocal(inicioVieja, finVieja)

    const inicioNueva = inicioVieja + 2 * 60 * MIN
    const finNueva = inicioNueva + 60 * MIN
    const labelNueva = labelLocal(inicioNueva, finNueva)

    const updates: any[] = []
    sheetsApi = {
      spreadsheets: {
        create: mock(async () => ({ data: { spreadsheetId: 'spreadsheet-1' } })),
        get: mock(async () => ({
          data: {
            sheets: [
              {
                data: [
                  {
                    rowData: [
                      row('ID', 'Nombre', labelVieja, '% Asistencia'),
                      row('u1', 'Juan', 'P', '100%'),
                      row('u3', 'Pedro', 'A', '0%'),
                    ],
                  },
                ],
              },
            ],
          },
        })),
        values: {
          clear: mock(async () => ({})),
          update: mock(async (params: any) => {
            updates.push(params)
            return {}
          }),
        },
      },
    }
    driveApi = {
      files: {
        list: mock(async () => ({ data: { files: [{ id: 'spreadsheet-1' }] } })),
        update: mock(async () => ({})),
      },
    }

    const asistencias = [
      {
        inicio: inicioNueva,
        fin: finNueva,
        estudiantes: [
          { userId: 'u1', nombre: 'Juan', presente: false },
          { userId: 'u2', nombre: 'María', presente: true },
        ],
      },
    ]

    await escribirAsistencia(new Request('http://x'), 'sala-1', 'Mi Sala', asistencias)

    expect(updates[0].requestBody.values).toEqual([
      ['ID', 'Nombre', labelVieja, labelNueva, '% Asistencia'],
      ['u1', 'Juan', 'P', 'A', '50%'],
      ['u2', 'María', '', 'P', '100%'],
      ['u3', 'Pedro', 'A', '', '0%'],
    ])
  })
})