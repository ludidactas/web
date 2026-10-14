import { NextResponse } from 'next/server'

import { auth } from '@/app/auth'
import { clienteDrive, responderError, sinIntegracionGoogle } from '@/server/google/cliente'
import { guardarColeccion, leerColecciones } from '@/server/google/drive'

type Parametros = { params: Promise<{ salaId: string }> }

/** Lista las colecciones de preguntas que el profe ya guardó en Drive para `salaId`. */
export async function GET(request: Request, { params }: Parametros) {
  const { salaId } = await params

  const vedado = await sinIntegracionGoogle()
  if (vedado) return vedado

  try {
    const api = await clienteDrive(request)
    return NextResponse.json({ colecciones: await leerColecciones(api, salaId) })
  } catch (e) {
    return responderError(e, { ruta: 'GET colecciones', salaId, email: (await auth())?.user?.email })
  }
}

/** Crea (o sobrescribe, si ya existe una con el mismo nombre) una colección de preguntas en el Drive del profe. */
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

  const vedado = await sinIntegracionGoogle()
  if (vedado) return vedado

  try {
    await guardarColeccion(await clienteDrive(request), { salaId, nombreSala }, nombre, contenido)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return responderError(e, { ruta: 'POST colecciones', salaId, email: (await auth())?.user?.email })
  }
}
