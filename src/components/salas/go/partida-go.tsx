'use client'

import { useOutlineFilter } from '@/components/fx/filtros'
import { CELDA_PX, coordenadaEnPixeles, BLANCO_MUERTA, RELLENO, TableroGoBase, type EstadoPiedra } from '@/lib/go/tablero-go-base'
import { BLANCO, calcularTerritorio, DAME, grupoEn, NEGRO, VACIO, type Color, type Tablero } from '@/lib/go/motor'
import { useMemo, useState } from 'react'

interface Punto {
  fila: number
  columna: number
}

/**
 * Tablero de la partida de Go en curso. Recibe el mismo formato de matriz que usa el motor del
 * servidor ('.' vacío, 'N' negro, 'B' blanco), así que no hace falta traducir nada entre server y UI.
 * La grilla/hoshi, el fondo y las piedras son `TableroGoBase` (src/lib/go/tablero-go-base.tsx) — el
 * mismo dibujo que usa `DesafioDojoGo` (src/lib/go-dojo/components/desafio-dojo-go.tsx, el tablero del
 * dojo de ejercicios). Acá solo se agrega lo propio de la partida en vivo: glow de turno, hint de
 * territorio, resalte de grupo durante el conteo, ghost de próxima jugada y jugada pendiente sin
 * confirmar.
 */
export function PartidaGo({
  tablero,
  tamaño,
  removidas,
  vivo,
  modoConteo,
  miColor,
  turno,
  esMiTurno,
  ultimaJugada,
  pendiente,
  deshabilitado,
  onJugar,
}: {
  tablero: Tablero
  tamaño: number
  /** Piedras marcadas como muertas durante la fase de conteo (se muestran atenuadas). */
  removidas?: boolean[][] | null
  /** Coordenadas de la última piedra jugada: se resalta con un anillo naranja para ubicarla rápido. */
  ultimaJugada?: Punto | null
  /** Puntos de cadenas incondicionalmente vivas (algoritmo de Benson): no se pueden marcar como muertas. */
  vivo?: boolean[][] | null
  /** Fase de conteo: grisa los grupos vivos (no seleccionables) y resalta el grupo bajo el cursor. */
  modoConteo?: boolean
  /** Color con el que jugaría el usuario: habilita el ghost de la próxima jugada. */
  miColor?: Color
  /** De quién es el turno: agrega un contorno del tablero de ese color. */
  turno?: Color
  /** Si el turno es del usuario, el contorno del tablero pulsa para que note que le toca jugar. */
  esMiTurno?: boolean
  /** Punto elegido pero todavía sin confirmar (fuera de `modoConteo`): se dibuja fijo, más sólido que
   * el ghost del hover, con un anillo punteado, hasta que se confirma la jugada con el botón afuera
   * del tablero o se cancela clickeándolo de nuevo. */
  pendiente?: Punto | null
  deshabilitado?: boolean
  onJugar?: (fila: number, columna: number) => void
}) {
  const [hover, setHover] = useState<Punto | null>(null)

  // Dos filtros de contorno fijo (no `currentColor`: el <feFlood> vive en un <svg> separado del
  // elemento que referencia el filtro, así que no hereda el `color` de ese elemento). Elegimos cuál
  // aplicar según el color del grupo, para que el contorno siempre sea el opuesto (negro <-> blanco).
  const contornoNegro = useOutlineFilter({ outlineColor: RELLENO[NEGRO], radius: 3 })
  const contornoBlanco = useOutlineFilter({ outlineColor: RELLENO[BLANCO], radius: 3 })

  function esSeleccionable(fila: number, columna: number) {
    if (modoConteo) return tablero[fila][columna] !== VACIO && !(vivo?.[fila][columna] ?? false)
    return tablero[fila][columna] === VACIO
  }

  const grupoHover = useMemo(() => {
    if (!modoConteo || !hover || !esSeleccionable(hover.fila, hover.columna)) return []
    return grupoEn(tablero, hover.fila, hover.columna, tamaño)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoConteo, hover, tablero, tamaño, vivo])

  const territorio = useMemo(
    () => (modoConteo ? calcularTerritorio(tablero, removidas, tamaño) : null),
    [modoConteo, tablero, removidas, tamaño]
  )

  // grupoEn solo devuelve puntos de un grupo ya ocupado (ver su chequeo de VACIO), así que si hay
  // algún punto acá su color nunca es VACIO.
  const colorGrupoHover = grupoHover.length > 0 ? (tablero[grupoHover[0][0]][grupoHover[0][1]] as Color) : null
  // El contorno es el opuesto al color del grupo (grupo negro -> contorno blanco, y viceversa).
  const filterUrlHover = colorGrupoHover === NEGRO ? contornoBlanco.filterUrl : contornoNegro.filterUrl

  // Contorno del tablero: acá sí es el MISMO color que el turno (blanco juega -> contorno blanco),
  // porque no estamos resaltando una piedra contra sí misma sino indicando de quién es el turno.
  const filterUrlTurno = turno === NEGRO ? contornoNegro.filterUrl : contornoBlanco.filterUrl

  // Ghost de la próxima jugada: previsualiza la piedra en la intersección vacía bajo el cursor.
  // No se dibuja sobre el punto ya elegido (`pendiente`): ese tiene su propio dibujo, más sólido.
  const mostrarGhost =
    !modoConteo &&
    !!miColor &&
    !!hover &&
    tablero[hover.fila][hover.columna] === VACIO &&
    !(pendiente && hover.fila === pendiente.fila && hover.columna === pendiente.columna)

  function estadoPiedra(y: number, x: number, valor: Color): EstadoPiedra {
    const muerta = removidas?.[y]?.[x] ?? false
    const esVivo = vivo?.[y]?.[x] ?? false
    const hovereada = grupoHover.some(([gx, gy]) => gx === x && gy === y)
    return {
      opacidad: esVivo ? 0.85 : muerta ? (hovereada ? 0.7 : 0.35) : 1,
      vivo: esVivo,
      fill: muerta && valor === BLANCO ? BLANCO_MUERTA : undefined,
      titulo: esVivo ? 'Grupo incondicionalmente vivo' : muerta ? 'Marcada como muerta' : undefined,
    }
  }

  return (
    <TableroGoBase
      tablero={tablero}
      tamaño={tamaño}
      glowMargen={10}
      disabled={deshabilitado}
      onPointClick={onJugar}
      esSeleccionable={esSeleccionable}
      onHoverChange={(p) => setHover(p ? { fila: p[0], columna: p[1] } : null)}
      estadoPiedra={estadoPiedra}
      className="max-w-[min(90vw,560px)] max-h-[min(70vh,560px)] aspect-square touch-none select-none"
      extraDefs={
        <>
          {contornoNegro.defs}
          {contornoBlanco.defs}
        </>
      }
      beforeBoard={({ lado }) =>
        // Glow del turno: un rect idéntico al fondo, pero atrás — solo se ve el halo dilatado que
        // asoma por los bordes. Va en una capa separada del tablero real para que, si pulsa, pulse
        // solo el halo y no todo el contenido del tablero.
        turno && (
          <g filter={filterUrlTurno} className={esMiTurno ? 'animate-pulse' : undefined}>
            <rect x={0} y={0} width={lado} height={lado} rx={8} fill={RELLENO[turno]} />
          </g>
        )
      }
      beforeStones={
        <>
          {/* Hint de territorio: si se confirma el conteo tal como está marcado ahora, de quién sería
              cada punto vacío (flood-fill). Va debajo de las piedras: en las marcadas como muertas, el
              tinte se asoma a través de su propia opacidad reducida. */}
          {territorio &&
            territorio.map((fila, y) =>
              fila.map((color, x) => {
                if (color === VACIO || color === DAME) return null
                return (
                  <rect
                    key={`terr-${x},${y}`}
                    x={coordenadaEnPixeles(x) - CELDA_PX * 0.32}
                    y={coordenadaEnPixeles(y) - CELDA_PX * 0.32}
                    width={CELDA_PX * 0.64}
                    height={CELDA_PX * 0.64}
                    fill={RELLENO[color]}
                    opacity={0.5}
                    pointerEvents="none"
                  />
                )
              })
            )}

          {/* Resalte del grupo bajo el cursor durante el conteo — contorno del color opuesto al grupo. */}
          {grupoHover.length > 0 && colorGrupoHover && (
            <g filter={filterUrlHover}>
              {grupoHover.map(([fila, columna]) => (
                <circle
                  key={`hover-${fila},${columna}`}
                  cx={coordenadaEnPixeles(columna)}
                  cy={coordenadaEnPixeles(fila)}
                  r={CELDA_PX * 0.46}
                  fill={RELLENO[colorGrupoHover]}
                />
              ))}
            </g>
          )}
        </>
      }
      afterStones={({ piezaFill, filtroSombraUrl }) => (
        <>
          {/* Anillo naranja sobre la última piedra jugada, para encontrarla de un vistazo. */}
          {ultimaJugada && (
            <circle
              cx={coordenadaEnPixeles(ultimaJugada.columna)}
              cy={coordenadaEnPixeles(ultimaJugada.fila)}
              r={CELDA_PX * 0.3}
              fill="none"
              className="stroke-ld-amarillo-oscuro"
              strokeWidth={CELDA_PX * 0.1}
              pointerEvents="none"
            />
          )}

          {/* Ghost de la próxima jugada: previsualiza dónde y de qué color caería la piedra */}
          {mostrarGhost && miColor && hover && (
            <circle
              cx={coordenadaEnPixeles(hover.columna)}
              cy={coordenadaEnPixeles(hover.fila)}
              r={CELDA_PX * 0.46}
              fill={piezaFill(miColor)}
              stroke="#1a1a1a"
              strokeWidth={miColor === NEGRO ? 0 : 1}
              opacity={0.4}
              pointerEvents="none"
              filter={filtroSombraUrl}
            />
          )}

          {/* Jugada elegida pero todavía sin confirmar: piedra fija (no sigue al mouse) con anillo
              punteado, para distinguirla del ghost de hover mientras se espera el botón de confirmar. */}
          {pendiente && miColor && tablero[pendiente.fila][pendiente.columna] === VACIO && (
            <g pointerEvents="none">
              <circle
                cx={coordenadaEnPixeles(pendiente.columna)}
                cy={coordenadaEnPixeles(pendiente.fila)}
                r={CELDA_PX * 0.46}
                fill={piezaFill(miColor)}
                stroke="#1a1a1a"
                strokeWidth={miColor === NEGRO ? 0 : 1}
                opacity={0.6}
                filter={filtroSombraUrl}
              />
              <circle
                cx={coordenadaEnPixeles(pendiente.columna)}
                cy={coordenadaEnPixeles(pendiente.fila)}
                r={CELDA_PX * 0.6}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            </g>
          )}
        </>
      )}
    />
  )
}
