import { NextResponse } from 'next/server'

import { auth } from '@/app/auth'
import { clienteDrive, responderError, sinIntegracionGoogle } from '@/server/google/cliente'
import { esPng, guardarImagenPartida, MAX_IMAGEN_PARTIDA_BYTES } from '@/server/google/drive'
import { esSalaIdValido } from '@/server/google/sala-id'

type Parametros = { params: Promise<{ salaId: string }> }

export async function POST(request: Request, { params }: Parametros) {
  const { salaId } = await params

  if (!esSalaIdValido(salaId)) {
    return NextResponse.json({ error: 'Sala inválida' }, { status: 400 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Faltan datos de la partida' }, { status: 400 })
  }

  const nombreSala = form.get('nombreSala')
  const partidaId = form.get('partidaId')
  const nombre = form.get('nombre')
  const imagen = form.get('imagen')

  if (typeof nombreSala !== 'string' || nombreSala.length === 0) {
    return NextResponse.json({ error: 'Falta el nombre de la sala' }, { status: 400 })
  }
  if (typeof partidaId !== 'string' || partidaId.length === 0) {
    return NextResponse.json({ error: 'Falta el id de la partida' }, { status: 400 })
  }
  if (typeof nombre !== 'string' || nombre.length === 0) {
    return NextResponse.json({ error: 'Falta el nombre de la imagen' }, { status: 400 })
  }
  if (!(imagen instanceof Blob)) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
  }
  if (imagen.size > MAX_IMAGEN_PARTIDA_BYTES) {
    return NextResponse.json({ error: 'La imagen es demasiado grande' }, { status: 400 })
  }

  const png = Buffer.from(await imagen.arrayBuffer())
  if (!esPng(png)) {
    return NextResponse.json({ error: 'La imagen tiene que ser PNG' }, { status: 400 })
  }

  const vedado = await sinIntegracionGoogle()
  if (vedado) return vedado

  try {
    const api = await clienteDrive(request)
    await guardarImagenPartida(api, { salaId, nombreSala }, partidaId, nombre, png)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return responderError(e, { ruta: 'POST partidas', salaId, email: (await auth())?.user?.email })
  }
}
