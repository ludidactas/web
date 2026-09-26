"use client";

import { CELDA_PX, coordenadaEnPixeles, TableroGoBase, type EstadoPiedra } from "@/lib/go/tablero-go-base";
import { NEGRO, VACIO, type Color } from "@/lib/go/motor";
import { tableroDesdePiedras } from "../motor-desafio";
import type { Punto, Marca, Piedra } from "../tipos";

/**
 * Tablero SVG del dojo: dibuja un problema estático de una sola jugada. La grilla/hoshi, el fondo y
 * las piedras son `TableroGoBase` (src/lib/go/tablero-go-base.tsx) — el mismo dibujo que usa
 * `PartidaGo` (src/components/salas/go/partida-go.tsx, el tablero de la partida multijugador en vivo).
 * Acá solo se agrega lo propio del dojo: ghost de ayuda, marks de anotación y los anillos de jugada
 * correcta.
 */

export interface DesafioDojoGoTheme {
  /** Marcador translúcido del punto de ayuda. */
  ghostFill: string;
  correctFill: string;
  correctStroke: string;
  playedMarkStroke: string;
  /** Color del glifo para anotaciones `marcas` (letra/círculo/triángulo/cuadrado/cruz). */
  markFill: string;
  /** Halo detrás de un glifo de marca, para que se lea tanto sobre la madera como sobre una piedra. */
  markHalo: string;
  /** Anillo de hover en puntos vacíos cuando no hay `nextMoveColor` para previsualizar una piedra (ej. tipo "exploracion") — si no, el hover se vería inerte. */
  hoverRing: string;
}

export const DEFAULT_DESAFIO_DOJO_GO_THEME: DesafioDojoGoTheme = {
  ghostFill: "rgba(192,57,43,0.35)",
  correctFill: "rgba(46,125,50,0.18)",
  correctStroke: "#2e7d32",
  playedMarkStroke: "rgba(255,255,255,0.85)",
  markFill: "#c0392b",
  markHalo: "rgba(255,255,255,0.9)",
  hoverRing: "rgba(63,45,18,0.55)",
};

function trianglePath(x: number, y: number, size: number): string {
  return `M ${x} ${y - size} L ${x + size} ${y + size * 0.7} L ${x - size} ${y + size * 0.7} Z`;
}

/** Una anotación `marcas` (letra/círculo/triángulo/cuadrado/cruz) en un punto del tablero. Puramente decorativa — nunca forma parte de la detección de clicks. */
function MarkGlyph({ mark, x, y, theme }: { mark: Marca; x: number; y: number; theme: DesafioDojoGoTheme }) {
  const radius = CELDA_PX * 0.28;
  const halo = `drop-shadow(0 0 1.5px ${theme.markHalo}) drop-shadow(0 0 1.5px ${theme.markHalo})`;

  switch (mark.tipo) {
    case "letra":
      return (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={CELDA_PX * 0.42}
          fontWeight={700}
          fill={theme.markFill}
          stroke={theme.markHalo}
          strokeWidth={3}
          paintOrder="stroke"
        >
          {mark.texto ?? ""}
        </text>
      );
    case "circulo":
      return (
        <circle cx={x} cy={y} r={radius} fill="none" stroke={theme.markFill} strokeWidth={2.5} style={{ filter: halo }} />
      );
    case "cuadrado": {
      const side = radius * 1.5;
      return (
        <rect
          x={x - side / 2}
          y={y - side / 2}
          width={side}
          height={side}
          fill="none"
          stroke={theme.markFill}
          strokeWidth={2.5}
          style={{ filter: halo }}
        />
      );
    }
    case "triangulo":
      return (
        <path
          d={trianglePath(x, y + radius * 0.3, radius * 1.2)}
          fill="none"
          stroke={theme.markFill}
          strokeWidth={2.5}
          style={{ filter: halo }}
        />
      );
    case "cruz": {
      const s = radius * 0.8;
      return (
        <g stroke={theme.markFill} strokeWidth={2.5} style={{ filter: halo }}>
          <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
          <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
        </g>
      );
    }
  }
}

export interface DesafioDojoGoProps {
  boardSize: number;
  stones: Piedra[];
  /** Ancho/alto CSS máximo del tablero (cuadrado), en px. Default 400. */
  pixelSize?: number;
  /** Punto a mostrar como marcador de ayuda translúcido, si hay alguno. */
  ghost?: Punto | null;
  /** Puntos a marcar con un anillo verde, mostrados tras una respuesta incorrecta. */
  correctMoveMarkers?: Punto[];
  /** Anotaciones puramente decorativas del tablero (letras de referencia, círculos, etc.) — nunca intercepta clicks. */
  marks?: Marca[];
  /** La piedra que acaba de jugar el estudiante, dibujada con un triángulo chico. */
  playedPoint?: Punto | null;
  /**
   * Color de la próxima jugada del estudiante (casi siempre el `turno` del
   * desafío). Si está seteado, hacer hover sobre una intersección vacía
   * previsualiza una piedra translúcida ahí — mismo comportamiento que el
   * ghost de PartidaGo.
   */
  nextMoveColor?: Color;
  onPointClick?: (r: number, c: number) => void;
  /** Si es true, se ignoran los clicks (ej. una vez que el problema ya fue respondido). */
  disabled?: boolean;
  theme?: Partial<DesafioDojoGoTheme>;
  className?: string;
  "aria-label"?: string;
}

export function DesafioDojoGo({
  boardSize,
  stones,
  pixelSize = 400,
  ghost = null,
  correctMoveMarkers = [],
  marks = [],
  playedPoint = null,
  nextMoveColor,
  onPointClick,
  disabled = false,
  theme,
  className,
  "aria-label": ariaLabel,
}: DesafioDojoGoProps) {
  const t = { ...DEFAULT_DESAFIO_DOJO_GO_THEME, ...theme };
  const tablero = tableroDesdePiedras(stones, boardSize);

  const estadoPiedra = (r: number, c: number, color: Color): EstadoPiedra => {
    const isPlayed = !!playedPoint && playedPoint[0] === r && playedPoint[1] === c;
    if (!isPlayed) return {};
    return {
      decoracion: (
        <path
          d={trianglePath(coordenadaEnPixeles(c), coordenadaEnPixeles(r), CELDA_PX * 0.46 * 0.4)}
          fill="none"
          stroke={color === NEGRO ? t.playedMarkStroke : "rgba(0,0,0,0.5)"}
          strokeWidth={1.5}
          pointerEvents="none"
        />
      ),
    };
  };

  return (
    <TableroGoBase
      tablero={tablero}
      tamaño={boardSize}
      disabled={disabled}
      onPointClick={onPointClick}
      estadoPiedra={estadoPiedra}
      ariaLabel={ariaLabel ?? "Tablero de Go"}
      className={className}
      style={{ maxWidth: pixelSize, maxHeight: pixelSize, aspectRatio: "1 / 1" }}
      beforeStones={
        ghost && (
          <circle
            cx={coordenadaEnPixeles(ghost[1])}
            cy={coordenadaEnPixeles(ghost[0])}
            r={CELDA_PX * 0.42}
            fill={t.ghostFill}
            pointerEvents="none"
          />
        )
      }
      afterStones={({ hover, piezaFill }) => {
        const hoverVacio = !!hover && tablero[hover[0]][hover[1]] === VACIO && !!onPointClick && !disabled;
        const mostrarPreview = hoverVacio && !!nextMoveColor;
        // No hay color para previsualizar una piedra (ej. tipo "exploracion", o un punto que no es de
        // jugada) — igual dar ALGÚN feedback de hover para que el tablero no se sienta inerte, solo un
        // anillo simple en vez de una piedra.
        const mostrarAnilloHover = hoverVacio && !nextMoveColor;

        return (
          <>
            {mostrarPreview && hover && (
              <circle
                cx={coordenadaEnPixeles(hover[1])}
                cy={coordenadaEnPixeles(hover[0])}
                r={CELDA_PX * 0.46}
                fill={piezaFill(nextMoveColor!)}
                opacity={0.4}
                pointerEvents="none"
              />
            )}

            {mostrarAnilloHover && hover && (
              <circle
                cx={coordenadaEnPixeles(hover[1])}
                cy={coordenadaEnPixeles(hover[0])}
                r={CELDA_PX * 0.3}
                fill="none"
                stroke={t.hoverRing}
                strokeWidth={2}
                pointerEvents="none"
              />
            )}

            {correctMoveMarkers.map(([r, c]) => (
              <circle
                key={`correct-${r},${c}`}
                cx={coordenadaEnPixeles(c)}
                cy={coordenadaEnPixeles(r)}
                r={CELDA_PX * 0.38}
                fill={t.correctFill}
                stroke={t.correctStroke}
                strokeWidth={2}
                pointerEvents="none"
              />
            ))}

            <g pointerEvents="none">
              {marks.map((m, i) => (
                <MarkGlyph key={`mark-${m.r},${m.c}-${i}`} mark={m} x={coordenadaEnPixeles(m.c)} y={coordenadaEnPixeles(m.r)} theme={t} />
              ))}
            </g>
          </>
        );
      }}
    />
  );
}
