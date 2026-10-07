import { beforeEach, describe, expect, test } from 'bun:test'
import { ErrorParseoDesafio } from './cargador'
import { cargarDesafiosDesdeRepoPublico, vaciarUltimasVersionesBuenas } from './cargador-repo'

const yaml = (id: string) => `
- id: ${id}
  titulo: "${id}"
  tamañoTablero: 9
  piedras: []
  jugadasCorrectas: [[4, 4]]
  explicacion: "ok"
`

const REPO = { owner: 'ludidactas', repo: 'desafios-ogs' }

/** `fetch` falso: un repo con `archivos` (path → contenido) y un registro de las URLs pedidas. */
function repoFalso(archivos: Record<string, string>, opciones: { status?: number; truncated?: boolean } = {}) {
  const pedidas: string[] = []
  const falso = (async (url: string) => {
    pedidas.push(url)
    if (opciones.status) return new Response('nope', { status: opciones.status })
    if (url.startsWith('https://api.github.com/')) {
      const tree = Object.keys(archivos).map((path) => ({ path, type: 'blob' }))
      tree.push({ path: '01-fundamentals', type: 'tree' })
      return Response.json({ tree, truncated: opciones.truncated })
    }
    const path = decodeURIComponent(url.split('/main/')[1])
    return path in archivos ? new Response(archivos[path]) : new Response('no existe', { status: 404 })
  }) as unknown as typeof fetch
  return { fetch: falso, pedidas }
}

describe('cargarDesafiosDesdeRepoPublico', () => {
  beforeEach(vaciarUltimasVersionesBuenas)

  const archivos = {
    '02-basic/b.yaml': yaml('b'),
    '01-fundamentals/02-ko.yaml': yaml('ko'),
    '01-fundamentals/01-juego.yaml': yaml('juego'),
    '01-fundamentals/sub/extra.yaml': yaml('extra'),
    '01-fundamentals/README.md': '# no es yaml',
    'LICENSE': 'AGPL',
  }

  test('carga los .yaml de la ruta, en orden alfabético y sin entrar a subdirectorios', async () => {
    const { fetch, pedidas } = repoFalso(archivos)
    const ds = await cargarDesafiosDesdeRepoPublico(REPO, { ruta: '01-fundamentals', fetch })
    expect(ds.map((d) => d.id)).toEqual(['juego', 'ko'])
    expect(pedidas[0]).toBe('https://api.github.com/repos/ludidactas/desafios-ogs/git/trees/main?recursive=1')
    expect(pedidas.slice(1).sort()).toEqual([
      'https://raw.githubusercontent.com/ludidactas/desafios-ogs/main/01-fundamentals/01-juego.yaml',
      'https://raw.githubusercontent.com/ludidactas/desafios-ogs/main/01-fundamentals/02-ko.yaml',
    ])
  })

  test('`recursivo` incluye los subdirectorios, y sin `ruta` toma toda la colección', async () => {
    const { fetch } = repoFalso(archivos)
    const ds = await cargarDesafiosDesdeRepoPublico(REPO, { recursivo: true, fetch })
    expect(ds.map((d) => d.id)).toEqual(['juego', 'ko', 'extra', 'b'])
  })

  test('acepta barras de borde en `ruta`', async () => {
    const { fetch } = repoFalso(archivos)
    const ds = await cargarDesafiosDesdeRepoPublico(REPO, { ruta: '/01-fundamentals/', fetch })
    expect(ds).toHaveLength(2)
  })

  test('manda el token si hay', async () => {
    const cabeceras: unknown[] = []
    const espia = (async (url: string, init?: RequestInit) => {
      cabeceras.push(init?.headers)
      return repoFalso(archivos).fetch(url, init as never)
    }) as unknown as typeof fetch
    await cargarDesafiosDesdeRepoPublico(REPO, { ruta: '02-basic', fetch: espia, token: 'abc' })
    expect(cabeceras.every((h) => (h as Record<string, string>).Authorization === 'Bearer abc')).toBe(true)
  })

  test('error claro si GitHub rechaza (límite de requests)', async () => {
    const { fetch } = repoFalso(archivos, { status: 403 })
    await expect(cargarDesafiosDesdeRepoPublico(REPO, { fetch })).rejects.toThrow(/403.*GITHUB_TOKEN/)
  })

  test('error si la ruta no tiene .yaml', async () => {
    const { fetch } = repoFalso(archivos)
    await expect(cargarDesafiosDesdeRepoPublico(REPO, { ruta: 'no-existe', fetch })).rejects.toThrow(ErrorParseoDesafio)
  })

  test('error si un archivo no valida, con el nombre del archivo', async () => {
    const { fetch } = repoFalso({ 'mal.yaml': '- id: x\n' })
    await expect(cargarDesafiosDesdeRepoPublico(REPO, { fetch })).rejects.toThrow(/mal\.yaml/)
  })

  test('error si hay ids repetidos entre archivos', async () => {
    const { fetch } = repoFalso({ 'a.yaml': yaml('igual'), 'b.yaml': yaml('igual') })
    await expect(cargarDesafiosDesdeRepoPublico(REPO, { fetch })).rejects.toThrow(/repetidos: igual/)
  })

  test('error si el listado viene truncado', async () => {
    const { fetch } = repoFalso(archivos, { truncated: true })
    await expect(cargarDesafiosDesdeRepoPublico(REPO, { fetch })).rejects.toThrow(/demasiado grande/)
  })

  describe('última versión buena', () => {
    const opciones = { ruta: '01-fundamentals' }

    test('si GitHub falla después de una carga exitosa, devuelve la última versión buena', async () => {
      const bueno = await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos).fetch })
      const respaldo = await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos, { status: 403 }).fetch })
      expect(respaldo).toEqual(bueno)
    })

    test('si un push dejó un YAML inválido, también devuelve la última versión buena', async () => {
      const bueno = await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos).fetch })
      const roto = { ...archivos, '01-fundamentals/03-roto.yaml': '- id: x\n' }
      const respaldo = await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(roto).fetch })
      expect(respaldo).toEqual(bueno)
    })

    test('una carga exitosa reemplaza a la versión buena anterior', async () => {
      await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos).fetch })
      const nuevos = { '01-fundamentals/01-juego.yaml': yaml('juego-v2') }
      expect((await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(nuevos).fetch })).map((d) => d.id)).toEqual(['juego-v2'])
      const respaldo = await cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos, { status: 500 }).fetch })
      expect(respaldo.map((d) => d.id)).toEqual(['juego-v2'])
    })

    test('sin carga previa (arranque en frío) el error se propaga', async () => {
      await expect(
        cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos, { status: 403 }).fetch })
      ).rejects.toThrow(/403/)
    })

    test('el respaldo es por ruta: no sirve la versión de otra ruta', async () => {
      await cargarDesafiosDesdeRepoPublico(REPO, { ruta: '02-basic', fetch: repoFalso(archivos).fetch })
      await expect(
        cargarDesafiosDesdeRepoPublico(REPO, { ...opciones, fetch: repoFalso(archivos, { status: 403 }).fetch })
      ).rejects.toThrow(/403/)
    })
  })
})
