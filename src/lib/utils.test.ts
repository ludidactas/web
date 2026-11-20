import { describe, expect, it, spyOn } from 'bun:test'
import * as XLSX from 'xlsx'
import type { ConfigSala, PlanillaCompleta } from '@/wss/validators/salas'
import { MetodosLogin, RolSala } from '@/wss/validators/auth'
import { CONFIG_DEFAULTS } from '@/wss/validators/overlay'
import { exportarPlanillaCompleta } from './utils'

const configSalaPorNombre: ConfigSala = {
  nombre: 'Sala de prueba',
  nombre_profe: 'Profe',
  link: 'x',
  metodo_login: MetodosLogin.Nombre,
  solo_invitados: false,
  overlay: CONFIG_DEFAULTS,
}

const planilla: PlanillaCompleta = {
  preguntas: [],
  filas: [
    {
      rol: RolSala.Estudiante,
      idSala: 'sala',
      metodo: MetodosLogin.Nombre,
      nombre: 'Ana',
      userId: 'hash-opaco-de-ana',
      conectado: true,
      respuestas: {},
    },
  ],
}

function exportarYLeerFilas(planillaCompleta: PlanillaCompleta) {
  const escribir = spyOn(XLSX, 'writeFile').mockImplementation(() => {})
  try {
    exportarPlanillaCompleta(planillaCompleta, configSalaPorNombre)
    const libro = escribir.mock.calls[0][0] as XLSX.WorkBook
    return XLSX.utils.sheet_to_json<string[]>(libro.Sheets.Estudiantes, { header: 1 })
  } finally {
    escribir.mockRestore()
  }
}

describe('exportarPlanillaCompleta', () => {
  it('en una sala por nombre, la columna ID muestra el nombre', () => {
    const [encabezado, fila] = exportarYLeerFilas(planilla)

    expect(encabezado).toEqual(['ID'])
    expect(fila).toEqual(['Ana'])
  })
})
