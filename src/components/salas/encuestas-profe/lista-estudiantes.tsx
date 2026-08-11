import {
  Check,
  CircleCheckBig,
  Copy,
  Download,
  Eraser,
  FileSpreadsheet,
  Link,
  ListCollapse,
  QrCode,
  School,
  Settings,
  SquareCheckBig,
  Users,
  X,
} from 'lucide-react'
import { PropsWithChildren, useRef, useState, useTransition } from 'react'
import { isEmpty } from 'remeda'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'

import { titulo as fuenteTitulo } from '@/components/fonts'
import getInitials, { getRandomColor } from '@/lib/avatarname'
import { cn, exportarPlanilla, exportarPlanillaCompleta } from '@/lib/utils'

import PanelConfigSala from './panel-config-sala'

import DebugPanel from '@/components/ui/debug-panel'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import useClipboard from '@/components/hooks/use-clipboard'

import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import { storeEncuestasProfe } from '@/wss-cli/stores/encuestas-store'
import { storeEstudiantes } from '@/wss-cli/stores/estudiantes-store'
import { storeConfig } from '@/wss-cli/stores/config-store'
import { storePermitidos } from '@/wss-cli/stores/permitidos-store'
import { MetodosLogin } from '@/wss/validators/auth'

export const ListaEstudiantes = () => {
  const { limpiarEstudiantes, pedirPlanillaCompleta } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { config: configSala } = storeConfig()
  const { lista: invitados, nombres: nombresInvitados } = storePermitidos()
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [exportandoPlanilla, startExportarPlanilla] = useTransition()

  const { handleCopy, justCopied } = useClipboard()

  const tituloSala =
    configSala?.nombre?.trim() || (configSala?.nombre_profe ? `Sala de ${configSala.nombre_profe}` : 'Tu sala')

  // Export local: recuperar cuando haya cuentas "full"
  // const handleExportToExcel = () => {
  //   const datosParaExcel = estudiantes.map((e) => ({
  //     Nombre: e.nombre || 'Sin nombre',
  //     Email: e.email || 'Sin email',
  //     DNI: e.dni || 'Sin DNI',
  //   }))

  //   exportarPlanilla(datosParaExcel)
  // }

  /** Exporta la planilla completa desde el estado del servidor: incluye a quienes ya no están
   * conectados (o fueron "limpiados" del store del FE) y una columna por cada pregunta con la
   * respuesta de cada estudiante. A diferencia de `handleExportToExcel`, no depende de lo que este
   * navegador haya visto en la sesión actual. */
  const handleExportarPlanillaCompleta = () =>
    startExportarPlanilla(async () => {
      try {
        const planilla = await pedirPlanillaCompleta()

        if (planilla.filas.length === 0 || !configSala) {
          toast.info('Todavía no hay estudiantes registrados en esta sala')
          return
        }

        exportarPlanillaCompleta(planilla, configSala)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo generar la planilla')
      }
    })

  const datosEstudiantes = estudiantes
    .map((e) => {
      const identificador = e.email || e.dni
      return identificador ? `${e.nombre} (${identificador})` : e.nombre
    })
    .join('\n')

  return (
    <div className="relative flex flex-col h-full">
      <DebugPanel classNames={{ button: 'absolute ' }} data={estudiantes} title="Estudiantes en sala" />

      {/* Header: título + acciones (link, QR, config) */}
      <div className={cn('flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3')}>
        <h1 className={cn('flex items-center gap-2 text-3xl font-medium text-ld-violeta-oscuro')}>
          <School size={28} /> Tu sala
        </h1>

        <div className={cn('flex flex-col gap-2')}>
          {/* Config solo si es por DNI: en salas por nombre no hay contenido útil para mostrar */}
          {configSala?.metodo_login === MetodosLogin.DNI && (
            <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
              <PanelConfigSala>
                <button
                  className={cn(
                    'group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80 transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base'
                  )}
                  title="Configurá el acceso a tu sala"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
                    Configurar
                  </span>
                </button>
              </PanelConfigSala>
            </div>
          )}

          {configSala?.link && (
            <>
              <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
                <button
                  className={cn(
                    'group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base',
                    linkCopiado
                      ? 'bg-emerald-500 hover:bg-emerald-500/80'
                      : 'bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80'
                  )}
                  onClick={() => {
                    navigator.clipboard.writeText(configSala.link)
                    setLinkCopiado(true)
                    setTimeout(() => setLinkCopiado(false), 2000)
                  }}
                  title="Copiá el link para compartirlo con tus estudiantes"
                >
                  {linkCopiado ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  ) : (
                    <Link className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  )}
                  <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
                    {linkCopiado ? '¡Copiado!' : 'Copiar link'}
                  </span>
                </button>
              </div>

              <DialogMostrarQR link={configSala.link} titulo={tituloSala} />
            </>
          )}
        </div>
      </div>

      {!configSala?.link && <p className={cn('text-center text-rose-500 text-sm pt-2')}>Link de sala no recibido</p>}

      {/* Lista de participantes */}
      <div className={cn('flex flex-col flex-1 overflow-hidden mt-4')}>
        <div className={cn('flex-1 overflow-y-auto')}>
          {estudiantes.length === 0 && (
            <>
              <p className="text-slate-400 italic mt-6 text-center">Ningún estudiante conectado aún...</p>
              <p className="text-slate-400 italic px-6 mt-2 text-center">
                ¡Compartí el link de la sala con tus estudiantes para que participen de las encuestas!
              </p>
            </>
          )}

          {estudiantes.length > 0 && (
            <ul className="flex flex-col gap-2 p-2 rounded-xl">
              {estudiantes.map((e) => (
                <li
                  key={e.userId}
                  className={cn('flex items-center gap-2', {
                    'text-black ': e.conectado,
                    'text-slate-400 grayscale': !e.conectado,
                  })}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 shrink-0 mt-1 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-center bg-cover"
                    style={{
                      backgroundImage: e.avatar ? `url(${e.avatar})` : undefined,
                      backgroundColor: getRandomColor(e.nombre || 'Anonimo'),
                    }}
                  >
                    {!e.avatar && getInitials(e.nombre || 'Anonimo')}
                  </div>
                  {/* Nombre, email y DNI */}
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      {e.nombre}
                      {nombresInvitados[e.userId] && (
                        <span className="text-xs text-slate-400">– {nombresInvitados[e.userId]}</span>
                      )}
                    </span>
                    {e.dni && <span className="text-teal-500">{e.dni}</span>}
                    {!e.dni && e.email && <span className="text-teal-500">{e.email}</span>}
                  </div>

                  <TooltipVotosEstudiante userId={e.userId}>
                    <ListCollapse className="ml-auto cursor-pointer text-gray-500 hover:text-cyan-500" />
                  </TooltipVotosEstudiante>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={cn('flex justify-end gap-2 mb-3 text-ld-violeta-oscuro')}>
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                    )}
                    disabled={estudiantes.length === 0}
                  >
                    <Eraser size={14} /> Limpiar
                  </button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Limpiá la lista de participantes</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="flex flex-col items-center">
              <DialogHeader>
                <DialogTitle className="text-center leading-6">¿Limpiar la lista de participantes?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-500 text-center">
                Se van a quitar de la lista los estudiantes desconectados.
                {invitados.length > 0 && ` Los ${invitados.length} invitados no se van a borrar.`}
              </p>
              <DialogFooter className="flex-row justify-center gap-2">
                <DialogClose>
                  <p className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm">Cancelar</p>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    className="flex items-center gap-1 bg-rose-700 text-white px-4 py-2 rounded-full text-sm"
                    onClick={limpiarEstudiantes}
                  >
                    <Eraser size={14} /> Limpiar
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                  justCopied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'hover:bg-slate-50'
                )}
                onClick={handleCopy(datosEstudiantes)}
                disabled={estudiantes.length === 0}
              >
                {justCopied ? <SquareCheckBig size={14} /> : <Copy size={14} />}
                {justCopied ? '¡Copiado!' : 'Copiar'}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copiá la lista de participantes</p>
            </TooltipContent>
          </Tooltip>
          {/* Cuando tengamos cuentas "full" volvemos a habilitar expor */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                )}
                onClick={handleExportToExcel}
                disabled={estudiantes.length === 0}
              >
                <Download size={14} /> Exportar
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Exportá la lista a Excel</p>
            </TooltipContent>
          </Tooltip> */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                )}
                onClick={handleExportarPlanillaCompleta}
                disabled={exportandoPlanilla}
              >
                <FileSpreadsheet size={14} /> {exportandoPlanilla ? 'Generando...' : 'Exportar'}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Exportá la lista a Excel</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

// Layout del QR exportado: fondo blanco redondeado, título arriba y firma de Ludidactas (logo + lema +
// tagline, igual que la header del sitio) abajo, todo dentro del margen.
const QR_EXPORT_SIZE = 220
const QR_EXPORT_PADDING = 24
const QR_EXPORT_TITLE_HEIGHT = 32
const QR_EXPORT_GAP = 12
const QR_EXPORT_RADIUS = 6
// Multiplica la resolución final sin tocar el layout (todo el dibujado sigue en unidades "lógicas"):
// evita que la imagen pegada en WhatsApp/Slack se vea borrosa al hacer zoom o mostrarla más grande.
const EXPORT_SCALE = 3

const FOOTER_ICON_SIZE = 28
const FOOTER_ICON_GAP = 8
const FOOTER_LEMA_WIDTH = 130
const FOOTER_LEMA_HEIGHT = Math.round((FOOTER_LEMA_WIDTH * 679) / 6558) // aspect ratio real de lema_sketchy_offlines.webp
const FOOTER_TAGLINE_GAP = 3
const FOOTER_TAGLINE_HEIGHT = 14
const FOOTER_HEIGHT = Math.max(FOOTER_ICON_SIZE, FOOTER_LEMA_HEIGHT + FOOTER_TAGLINE_GAP + FOOTER_TAGLINE_HEIGHT)

const QR_EXPORT_WIDTH = QR_EXPORT_SIZE + QR_EXPORT_PADDING * 2
const QR_EXPORT_HEIGHT =
  QR_EXPORT_PADDING +
  QR_EXPORT_TITLE_HEIGHT +
  QR_EXPORT_GAP +
  QR_EXPORT_SIZE +
  QR_EXPORT_GAP +
  FOOTER_HEIGHT +
  QR_EXPORT_PADDING

/** Traza un rectángulo con las esquinas redondeadas, sin dibujarlo (llamar a fill/clip después). */
function trazarRectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/** Carga una imagen; resuelve `undefined` (en vez de rechazar) si falla, para poder exportar igual sin ella. */
const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement | undefined>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(undefined)
    img.src = src
  })

/** Botón + dialog con el QR de la sala. El QR mostrado es el que se usa como fuente al exportar,
 * así garantizamos que ya está pintado (el usuario lo está viendo) al momento de armar la imagen final. */
function DialogMostrarQR({ link, titulo }: { link: string; titulo: string }) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [copiado, setCopiado] = useState(false)

  /** Compone margen blanco redondeado + título + QR + firma de Ludidactas sobre un canvas nuevo y lo copia como PNG. */
  const copiar = async () => {
    const qr = qrRef.current
    if (!qr) return

    const [logo, lema] = await Promise.all([
      cargarImagen('/img/Logo.webp'),
      cargarImagen('/img/lema_sketchy_offlines.webp'),
    ])
    // La tagline usa la misma tipografía (Chelsea Market) que "Educación emergente" en la home; si no
    // llega a cargar a tiempo, el canvas cae al fallback de la familia y se ve igual de legible.
    await document.fonts.load(`${FOOTER_TAGLINE_HEIGHT}px ${fuenteTitulo.style.fontFamily}`).catch(() => {})

    const canvasFinal = document.createElement('canvas')
    canvasFinal.width = QR_EXPORT_WIDTH * EXPORT_SCALE
    canvasFinal.height = QR_EXPORT_HEIGHT * EXPORT_SCALE
    const ctx = canvasFinal.getContext('2d')
    if (!ctx) return

    // A partir de acá seguimos dibujando en las mismas unidades "lógicas" (220, 24, etc.): el scale
    // se encarga de que todo salga más grande sin tener que multiplicar cada número a mano.
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE)

    ctx.save()
    trazarRectRedondeado(ctx, 0, 0, QR_EXPORT_WIDTH, QR_EXPORT_HEIGHT, QR_EXPORT_RADIUS)
    ctx.clip()

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, QR_EXPORT_WIDTH, QR_EXPORT_HEIGHT)

    // Título: "Sala" (etiqueta) + nombre de la sala (dato provisto, se destaca en otro color)
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const maxAnchoTitulo = QR_EXPORT_WIDTH - QR_EXPORT_PADDING * 2
    const etiqueta = 'Sala '
    const anchoEtiqueta = ctx.measureText(etiqueta).width
    let nombreSala = titulo
    while (ctx.measureText(nombreSala).width > maxAnchoTitulo - anchoEtiqueta && nombreSala.length > 1) {
      nombreSala = nombreSala.slice(0, -2) + '…'
    }
    let x = (QR_EXPORT_WIDTH - anchoEtiqueta - ctx.measureText(nombreSala).width) / 2
    const tituloY = QR_EXPORT_PADDING + QR_EXPORT_TITLE_HEIGHT / 2
    ctx.fillStyle = '#6F41CB'
    ctx.fillText(etiqueta, x, tituloY)
    x += anchoEtiqueta
    ctx.fillStyle = '#14b8a6'
    ctx.fillText(nombreSala, x, tituloY)

    // QR
    const qrY = QR_EXPORT_PADDING + QR_EXPORT_TITLE_HEIGHT + QR_EXPORT_GAP
    ctx.drawImage(qr, QR_EXPORT_PADDING, qrY, QR_EXPORT_SIZE, QR_EXPORT_SIZE)

    // Firma: logo + (lema arriba, "Educación emergente" abajo), igual que la header del sitio
    const footerY = qrY + QR_EXPORT_SIZE + QR_EXPORT_GAP
    const footerAncho = FOOTER_ICON_SIZE + FOOTER_ICON_GAP + FOOTER_LEMA_WIDTH
    let fx = (QR_EXPORT_WIDTH - footerAncho) / 2

    if (logo) {
      const logoY = footerY + (FOOTER_HEIGHT - FOOTER_ICON_SIZE) / 2
      ctx.drawImage(logo, fx, logoY, FOOTER_ICON_SIZE, FOOTER_ICON_SIZE)
    }
    fx += FOOTER_ICON_SIZE + FOOTER_ICON_GAP

    if (lema) {
      ctx.drawImage(lema, fx, footerY, FOOTER_LEMA_WIDTH, FOOTER_LEMA_HEIGHT)
    }

    ctx.font = `${FOOTER_TAGLINE_HEIGHT - 2}px ${fuenteTitulo.style.fontFamily}`
    ctx.fillStyle = '#1f2937'
    ctx.fillText(
      'Educación emergente',
      fx,
      footerY + FOOTER_LEMA_HEIGHT + FOOTER_TAGLINE_GAP + FOOTER_TAGLINE_HEIGHT / 2
    )

    ctx.restore()

    canvasFinal.toBlob((blob) => {
      if (!blob) {
        toast.error('No se pudo generar la imagen del QR')
        return
      }

      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(() => {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        })
        .catch(() => toast.error('No se pudo copiar el QR. Probá con otro navegador.'))
    }, 'image/png')
  }

  return (
    <Dialog>
      <div className="contents md:relative md:block md:w-11 md:h-11 md:shrink-0">
        <DialogTrigger asChild>
          <button
            className="group flex items-center w-full md:w-fit justify-center gap-2 md:gap-0 md:hover:gap-2 font-semibold text-white text-sm px-4 py-3 md:py-0 rounded-full bg-ld-azul hover:bg-ld-azul/80 transition-colors md:absolute md:right-0 md:top-0 md:z-10 md:h-11 md:flex-row-reverse md:justify-start md:hover:px-4 md:text-base"
            title="Mostrá el código QR para que tus estudiantes se unan escaneándolo"
          >
            <QrCode className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:group-hover:max-w-[120px] md:transition-all md:duration-300 md:ease-in-out">
              Mostrar QR
            </span>
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className={cn('flex flex-col items-center gap-3 w-fit p-4')} aria-description="QR de tu sala">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-ld-violeta-oscuro">{titulo}</DialogTitle>
        </DialogHeader>
        {/* size va a mayor resolución que lo que se ve (via style) para que al exportar en EXPORT_SCALE
            no salga borroso; el tamaño visible del diálogo no cambia. */}
        <QRCodeCanvas
          ref={qrRef}
          value={link}
          size={QR_EXPORT_SIZE * EXPORT_SCALE}
          style={{ width: QR_EXPORT_SIZE, height: QR_EXPORT_SIZE }}
        />
        <button
          className={cn(
            'flex items-center gap-1 px-4 py-1.5 rounded-full text-white text-sm transition-colors active:scale-95',
            copiado ? 'bg-emerald-500 hover:bg-emerald-500/80' : 'bg-ld-azul hover:bg-ld-azul/80'
          )}
          onClick={copiar}
        >
          {copiado ? <Check size={14} /> : <Copy size={14} />}
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
        <DialogFooter>
          <DialogClose>
            <p className={cn('px-3 py-1 text-white text-sm border-2 bg-teal-500 rounded-full')}>Cerrar</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ListaMobile = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (
    <div className="block lg:hidden self-center">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <h1 className="flex gap-2 text-md font-bold bg-indigo-50 p-4 mb-2 rounded-xl text-indigo-500">
            <Users className="w-30 self-center" />
            Lista de Participantes
          </h1>
        </DialogTrigger>
        <DialogContent className="overflow-y-auto rounded-xl">
          <DialogTitle />
          {children}
          <DialogClose className="justify-items-center">
            <X size={40} className="bg-indigo-500 text-white  rounded-full p-2" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TooltipVotosEstudiante({ children, userId }: PropsWithChildren & { userId: string }) {
  const [open, setOpen] = useState(false)

  const { pedirVotosEstudiante } = useConexionProfe()
  const { items: estudiantes } = storeEstudiantes()
  const { items: encuestas } = storeEncuestasProfe()

  const estudiante = estudiantes.find((e) => e.userId === userId)

  if (!estudiante) return children

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger onClick={() => setOpen(true)} onMouseEnter={() => pedirVotosEstudiante(userId)} asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent asChild>
        <div className="text-sm rounded-md flex flex-col gap-2 max-h-[40vh] max-w-md overflow-y-auto pl-2 pr-4">
          {!estudiante.votos && 'Cargando...'}
          {estudiante.votos && isEmpty(estudiante.votos) && 'No votó todavía'}
          {estudiante.votos &&
            Object.entries(estudiante.votos).map(([idEncuesta, idsOpciones]) => {
              // Buscamos la encuesta por id en el storage para renderizar el nombre
              const encuesta = encuestas.find((e) => e.id === idEncuesta)

              if (!encuesta)
                return (
                  <div key={idEncuesta} className="text-gray-500">
                    Encuesta {idEncuesta} no encontrada
                  </div>
                )

              const textoPregunta =
                encuesta.pregunta.length > 120 ? encuesta.pregunta.slice(0, 120) + '...' : encuesta.pregunta

              return (
                <div key={idEncuesta} className="hover:bg-[#d9f3f8] py-1 px-2 rounded">
                  <strong>{textoPregunta}</strong>
                  <div>
                    {idsOpciones.map((idOpcion, i) => {
                      // Buscamos la opción por id en la encuesta para renderizar el texto
                      const opcion = encuesta.opciones.find((o) => o.id === idOpcion)

                      if (!opcion)
                        return (
                          <p key={i} className="text-gray-500">
                            Opción {idOpcion} no encontrada
                          </p>
                        )

                      const textoOpcion = opcion.texto.length > 120 ? opcion.texto.slice(0, 120) + '...' : opcion.texto

                      return (
                        <p key={i} className="pl-1 flex gap-0.5 items-center text-xs">
                          {encuesta.admiteMultiplesVotos && <SquareCheckBig className="w-3 h-3 shrink-0" />}
                          {!encuesta.admiteMultiplesVotos && <CircleCheckBig className="w-3 h-3 shrink-0" />}
                          {textoOpcion}
                        </p>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
