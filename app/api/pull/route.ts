// Endpoint en construcción. Debería permitir cargar el contenido que esté en el git del obsidian.

import { revalidatePath } from 'next/cache'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  // Auntenticamos
  const { headers } = request
  if (headers.get('x-secret') !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Pulleamos contenido (cargado mediante obsidian)
    await execAsync('git pull origin main')
    // Revalidamos roadmap
    revalidatePath('/roadmap')
    return Response.json({ revalidated: true })
  } catch {
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
