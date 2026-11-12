import { Icon } from '@iconify/react/dist/iconify.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const REGLAS: { titulo: string; texto: string }[] = [
  { titulo: 'Objetivo', texto: 'Gana quien consigue más territorio.' },
  {
    titulo: 'Turnos',
    texto: 'Un jugador lleva las piedras negras y el otro las blancas. Se juega una jugada por turno, alternando. Negro empieza.',
  },
  {
    titulo: 'Dónde jugar',
    texto: 'En cualquier intersección vacía donde la piedra pueda quedar según la regla de libertades.',
  },
  {
    titulo: 'Libertades',
    texto:
      'Un grupo de piedras existe mientras tenga al menos un punto vacío pegado en horizontal o vertical: una libertad. Ningún grupo sin libertades puede quedar en el tablero.',
  },
  {
    titulo: 'Captura',
    texto: 'Si tu jugada deja sin libertades piedras del rival, se retiran del tablero y pasan a ser prisioneros.',
  },
  { titulo: 'Ko', texto: 'No vale ninguna jugada que repita una posición anterior del tablero.' },
  {
    titulo: 'Vida y muerte',
    texto: 'Las piedras que el rival no puede capturar están vivas; las demás están muertas.',
  },
  {
    titulo: 'Territorio',
    texto:
      'Son los puntos vacíos rodeados solo por piedras vivas de un jugador; cada uno vale un punto. Los puntos vacíos que tocan piedras de ambos colores no cuentan para nadie.',
  },
  {
    titulo: 'Fin de la partida',
    texto: 'Dos pases seguidos detienen el juego. Después se marcan las piedras muertas y los dos confirman el conteo.',
  },
  {
    titulo: 'Resultado',
    texto:
      'Las piedras muertas se suman a los prisioneros. A cada jugador se le resta de su territorio la cantidad de prisioneros que le hizo el rival. Blanco suma komi: 5.5 en 9×9, 6.5 en 13×13 y 7.5 en 19×19. Gana quien tiene más puntos.',
  },
  { titulo: 'Abandono', texto: 'Un jugador puede abandonar en cualquier momento; gana el rival.' },
]

export function ReglasGo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex gap-1 items-center text-sm text-ld-violeta-oscuro hover:scale-105 font-bold">
          <Icon className="w-6 h-6" icon={'lucide:book-open'} />
          Reglas
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Reglas del Go</DialogTitle>
        </DialogHeader>
        <dl className="flex flex-col gap-3 text-sm">
          {REGLAS.map(({ titulo, texto }) => (
            <div key={titulo}>
              <dt className="font-bold">{titulo}</dt>
              <dd className="text-slate-700">{texto}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-slate-500">Basadas en las Reglas Japonesas de Go (Nihon Ki-in, 1989).</p>
      </DialogContent>
    </Dialog>
  )
}
