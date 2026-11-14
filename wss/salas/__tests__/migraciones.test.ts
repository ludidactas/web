import { describe, expect, it } from 'bun:test'
import { AccesoSala, MetodosLogin } from '../../validators/auth'
import { salaCodec } from '../db'
import { soloInvitadosAAcceso } from '../migraciones'

const sala = (config: Record<string, unknown>) => ({
  id: 's1',
  profe: { email: 'profe@test.com' },
  config: { nombre_profe: 'Profe', link: 'x', ...config },
})

describe('soloInvitadosAAcceso', () => {
  const casos: [MetodosLogin, boolean, AccesoSala][] = [
    [MetodosLogin.Nombre, false, AccesoSala.Libre],
    [MetodosLogin.Nombre, true, AccesoSala.Lista],
    [MetodosLogin.DNI, false, AccesoSala.Invitados],
    [MetodosLogin.DNI, true, AccesoSala.Lista],
    [MetodosLogin.Google, false, AccesoSala.Invitados],
    [MetodosLogin.Google, true, AccesoSala.Lista],
  ]

  for (const [metodo_login, solo_invitados, esperado] of casos) {
    it(`${metodo_login} con solo_invitados=${solo_invitados} → ${esperado}`, () => {
      const { config } = soloInvitadosAAcceso(sala({ metodo_login, solo_invitados }))
      expect(config).toMatchObject({ metodo_login, acceso: esperado })
      expect(config).not.toHaveProperty('solo_invitados')
    })
  }

  it('el codec lee una sala v0 con el schema actual y escribe la versión nueva', () => {
    const v0 = JSON.stringify(sala({ metodo_login: MetodosLogin.DNI, solo_invitados: true }))
    const leida = salaCodec.parsear(v0)
    expect(leida.config.acceso).toBe(AccesoSala.Lista)
    expect(JSON.parse(salaCodec.serializar(leida)).v).toBe(1)
  })
})
