import { NextResponse } from 'next/server'

import { auth } from '@/app/auth'
import { tieneIntegracionGoogle } from '@/server/entitlements'
import { clienteDrive, responderError } from '@/server/google/cliente'
import { guardarColeccion, leerColecciones } from '@/server/google/drive'

type Parametros = { params: Promise<{ salaId: string }> }

async function sinIntegracion() {
  const session = await auth()
  if (await tieneIntegracionGoogle(session?.user?.email)) return null

  return NextResponse.json({ error: 'La integración con Google no está habilitada' }, { status: 403 })
}

export async function GET(request: Request, { params }: Parametros) {
  const { salaId } = await params

  const vedado = await sinIntegracion()
  if (vedado) return vedado

  try {
    const api = await clienteDrive(request)
    return NextResponse.json({ colecciones: await leerColecciones(api, salaId) })
  } catch (e) {
    return responderError(e)
  }
}

export async function POST(request: Request, { params }: Parametros) {
  const { salaId } = await params
  const { nombreSala, nombre, contenido } = (await request.json()) as {
    nombreSala?: string
    nombre?: string
    contenido?: string
  }

  if (!nombreSala || !nombre || !contenido) {
    return NextResponse.json({ error: 'Faltan datos de la colección' }, { status: 400 })
  }

  const vedado = await sinIntegracion()
  if (vedado) return vedado

  try {
    await guardarColeccion(await clienteDrive(request), { salaId, nombreSala }, nombre, contenido)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return responderError(e)
  }
}
