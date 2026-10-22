import { NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/app/auth'
import { responderError, sinIntegracionGoogle } from '@/server/google/cliente'
import { escribirAsistencia } from '@/server/google/sheets-asistencia'
import { asistenciaDeClaseSchema } from '@/wss/validators/asistencia'

type Parametros = { params: Promise<{ salaId: string }> }

/** Body que manda el FE del profe con las asistencias pendientes (ver `escribirAsistenciaEnDrive`). */
const bodySchema = z.object({
  nombreSala: z.string().min(1),
  asistencias: z.array(asistenciaDeClaseSchema).min(1),
})

export async function POST(request: Request, { params }: Parametros) {
  const { salaId } = await params

  // `null` cubre el body que no es JSON válido, que si no reventaría en un 500.
  const body = bodySchema.safeParse(await request.json().catch(() => null))

  if (!body.success) {
    return NextResponse.json({ error: 'Faltan datos de asistencia' }, { status: 400 })
  }

  const vedado = await sinIntegracionGoogle()
  if (vedado) return vedado

  try {
    await escribirAsistencia(request, salaId, body.data.nombreSala, body.data.asistencias)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return responderError(e, { ruta: 'POST asistencia', salaId, email: (await auth())?.user?.email })
  }
}
