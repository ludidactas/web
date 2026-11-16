import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'
import { Icon } from '@iconify/react/dist/iconify.js'

import { cn } from '@/lib/utils'
import {
  ajustarTexto,
  canvasAPng,
  cargarFirma,
  dibujarFirma,
  EXPORT_SCALE,
  FIRMA_ALTO,
  trazarRectRedondeado,
} from '@/lib/imagen-compartible'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Layout del QR exportado: fondo blanco redondeado, título arriba y firma de Ludidactas (logo + lema +
// tagline, igual que la header del sitio) abajo, todo dentro del margen.
const QR_EXPORT_SIZE = 220
const QR_EXPORT_PADDING = 24
const QR_EXPORT_TITLE_HEIGHT = 32
const QR_EXPORT_GAP = 12
const QR_EXPORT_RADIUS = 6
const QR_EXPORT_WIDTH = QR_EXPORT_SIZE + QR_EXPORT_PADDING * 2
const QR_EXPORT_HEIGHT =
  QR_EXPORT_PADDING +
  QR_EXPORT_TITLE_HEIGHT +
  QR_EXPORT_GAP +
  QR_EXPORT_SIZE +
  QR_EXPORT_GAP +
  FIRMA_ALTO +
  QR_EXPORT_PADDING

/** Botón + dialog con el QR de la sala. El QR mostrado es el que se usa como fuente al exportar,
 * así garantizamos que ya está pintado (el usuario lo está viendo) al momento de armar la imagen final. */
export function DialogMostrarQR({ link, titulo }: { link: string; titulo: string }) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [copiado, setCopiado] = useState(false)

  /** Compone margen blanco redondeado + título + QR + firma de Ludidactas sobre un canvas nuevo y lo copia como PNG. */
  const copiar = async () => {
    const qr = qrRef.current
    if (!qr) return

    const firma = await cargarFirma()

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
    const nombreSala = ajustarTexto(ctx, titulo, maxAnchoTitulo - anchoEtiqueta)
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
    dibujarFirma(ctx, firma, QR_EXPORT_WIDTH, qrY + QR_EXPORT_SIZE + QR_EXPORT_GAP)

    ctx.restore()

    const blob = await canvasAPng(canvasFinal).catch(() => null)
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
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 h-10 px-4 rounded-lg font-semibold text-white bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80 transition-colors"
          title="Mostrá el código QR para que tus estudiantes se unan escaneándolo"
        >
          <Icon icon="lucide:qr-code" className="w-4 h-4 shrink-0" />
          QR
        </button>
      </DialogTrigger>
      <DialogContent className={cn('flex flex-col items-center gap-4 w-fit px-14 py-8')} aria-description="QR de tu sala">
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
            copiado ? 'bg-emerald-500 hover:bg-emerald-500/80' : 'bg-ld-violeta-oscuro hover:bg-ld-violeta-oscuro/80'
          )}
          onClick={copiar}
        >
          {copiado ? (
            <Icon icon="lucide:check" width={14} height={14} />
          ) : (
            <Icon icon="lucide:copy" width={14} height={14} />
          )}
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
        <DialogFooter>
          <DialogClose>
            <p className={cn('flex items-center gap-1 px-3 py-1 text-white text-sm border-2 bg-red-500 hover:bg-red-500/80 rounded-full transition-colors')}>
              <Icon icon="ci:close-md" width={14} height={14} />
              Cerrar
            </p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
