import { capturasEnJugada, grupoEn, tableroVacio, type Color, type Tablero } from "@/lib/go/motor";
import type { Desafio, Punto, Desenlace, ResultadoEvaluacion, Piedra, NodoSecuencia } from "./tipos";

/**
 * Lógica de un desafío del dojo: evalúa la jugada de un estudiante contra un `Desafio` armando un
 * tablero de una sola posición y delegando en el motor compartido (`@/lib/go/motor`) — a diferencia de
 * una partida real, acá no hace falta historial ni turnos alternados, cada desafío es autocontenido.
 */

/** Serializa una coordenada siempre igual para que las búsquedas en Set/Map coincidan. */
export function clavePunto(r: number, c: number): string {
  return `${r},${c}`;
}

export function puntoDesdeClave(clave: string): Punto {
  const [r, c] = clave.split(",").map(Number);
  return [r, c];
}

/**
 * Arma la grilla densa que usa el motor compartido (src/lib/go/motor.ts) a partir de la lista
 * dispersa de piedras del desafío. `r`/`c` (fila/columna) del desafío son directamente
 * `[fila][columna]` de la grilla — no hay transposición: son el mismo eje con otro nombre. `Piedra`
 * ya guarda su color como `Color` (el mismo tipo del motor), así que tampoco hay conversión de color.
 */
export function tableroDesdePiedras(piedras: Piedra[], tamañoTablero: number): Tablero {
  const tablero = tableroVacio(tamañoTablero);
  for (const p of piedras) tablero[p.r][p.c] = p.color;
  return tablero;
}

/**
 * Devuelve el set de piedras rivales capturadas al poner `colorJugada` en (pr, pc). No muta
 * `piedras`. Point keys, ej. "4,5".
 *
 * Delega el cómputo real en `capturasEnJugada` del motor compartido con la partida en vivo — misma
 * convención (fila, columna), sin conversión de eje.
 */
export function calcularCapturas(
  piedras: Piedra[],
  pr: number,
  pc: number,
  colorJugada: Color,
  tamañoTablero: number
): Set<string> {
  const tablero = tableroDesdePiedras(piedras, tamañoTablero);
  tablero[pr][pc] = colorJugada;

  const capturadas = capturasEnJugada(tablero, pr, pc, colorJugada, tamañoTablero);
  return new Set(capturadas.map(([r, c]) => clavePunto(r, c)));
}

/** True si ya hay una piedra en (r, c). */
export function estaOcupado(piedras: Piedra[], r: number, c: number): boolean {
  return piedras.some((p) => p.r === r && p.c === c);
}

/**
 * Pone `color` en (r, c), removiendo cualquier grupo rival que pierda su
 * última libertad. Pura — devuelve una lista de piedras nueva, `piedras`
 * queda intacta. Se usa tanto para los desafíos `tipo: "jugada"` de una sola
 * jugada como para recorrer un árbol `tipo: "secuencia"` jugada por jugada
 * (la del estudiante, después la respuesta automática del rival).
 */
export function aplicarJugada(
  piedras: Piedra[],
  r: number,
  c: number,
  color: Color,
  tamañoTablero: number
): { piedras: Piedra[]; capturadas: Set<string> } {
  const capturadas = calcularCapturas(piedras, r, c, color, tamañoTablero);
  const next = piedras.filter((p) => !capturadas.has(clavePunto(p.r, p.c)));
  next.push({ r, c, color });
  return { piedras: next, capturadas };
}

/** Busca la entrada de `desenlaces` para (r, c), si el desafío define alguna. */
function buscarDesenlace(desafio: Desafio, r: number, c: number): Desenlace | undefined {
  return desafio.desenlaces?.find(({ en: [mr, mc] }) => mr === r && mc === c);
}

/**
 * True si (r, c) es una de las respuestas aceptadas del desafío. Prioriza
 * `desenlaces` cuando está presente (veredicto por punto); si no, cae en la
 * lista legacy `jugadasCorrectas`.
 */
export function esJugadaCorrecta(desafio: Desafio, r: number, c: number): boolean {
  if (desafio.desenlaces?.length) {
    const desenlace = buscarDesenlace(desafio, r, c);
    return desenlace?.correcto ?? false;
  }
  return (desafio.jugadasCorrectas ?? []).some(([mr, mc]) => mr === r && mc === c);
}

/**
 * Resultado de tocar una piedra en un desafío `tipo: "retirar"`: `muerta` indica si el grupo tocado
 * es uno de los que hay que retirar; `piedras` ya no lo contiene en ese caso, y `completo` es true
 * cuando no queda ningún grupo de `piedrasMuertas` en el tablero.
 */
export interface ResultadoRetiro {
  piedras: Piedra[];
  muerta: boolean;
  completo: boolean;
}

/**
 * Evalúa el toque del estudiante en (r, c) sobre `piedras` (el estado actual del tablero). Devuelve
 * null si ahí no hay ninguna piedra. Pura — `piedras` queda intacta.
 */
export function retirarGrupo(
  desafio: Desafio,
  piedras: Piedra[],
  r: number,
  c: number
): ResultadoRetiro | null {
  if (!estaOcupado(piedras, r, c)) return null;
  const { tamañoTablero } = desafio;
  const grupo = grupoEn(tableroDesdePiedras(piedras, tamañoTablero), r, c, tamañoTablero);
  const objetivos = desafio.piedrasMuertas ?? [];
  const muerta = objetivos.some(([pr, pc]) => grupo.some(([gr, gc]) => gr === pr && gc === pc));
  if (!muerta) return { piedras, muerta: false, completo: false };

  const retiradas = new Set(grupo.map(([gr, gc]) => clavePunto(gr, gc)));
  const restantes = piedras.filter((p) => !retiradas.has(clavePunto(p.r, p.c)));
  const completo = objetivos.every(([pr, pc]) => !estaOcupado(restantes, pr, pc));
  return { piedras: restantes, muerta: true, completo };
}

/** El punto que debería revelar el botón de ayuda para un desafío. */
export function puntoDeAyuda(desafio: Desafio): Punto | null {
  if (desafio.tipo === "opciones") return null;
  if (desafio.ayuda) return desafio.ayuda;
  if (desafio.tipo === "retirar") return desafio.piedrasMuertas?.[0] ?? null;
  if (desafio.jugadasCorrectas?.length) return desafio.jugadasCorrectas[0];
  const desenlaceCorrecto = desafio.desenlaces?.find((d) => d.correcto);
  return desenlaceCorrecto?.en ?? null;
}

/**
 * Evalúa el click de un estudiante contra un desafío `tipo: "jugada"` (o
 * "exploracion"). Devuelve null si el punto está fuera del tablero u ocupado
 * (o sea, no es una jugada legal para probar). Cuando el desafío define
 * `desenlaces`, `resultado.desenlace` trae el texto/marcas propios de ese punto;
 * si no, queda sin definir y el caller usa el `mensajeExito`/
 * `mensajeError`/`explicacion` genérico del desafío.
 */
export function evaluarJugada(
  desafio: Desafio,
  r: number,
  c: number
): ResultadoEvaluacion | null {
  const { tamañoTablero, piedras, turno } = desafio;
  if (r < 0 || r >= tamañoTablero || c < 0 || c >= tamañoTablero) return null;
  if (estaOcupado(piedras, r, c)) return null;

  const capturadas = calcularCapturas(piedras, r, c, turno, tamañoTablero);
  const desenlace = buscarDesenlace(desafio, r, c);
  return {
    jugada: [r, c],
    capturadas,
    esCorrecta: esJugadaCorrecta(desafio, r, c),
    desenlace: desenlace ? { texto: desenlace.texto, marcas: desenlace.marcas } : undefined,
  };
}

/** Ventana cuadrada de la grilla, en índices inclusivos de fila/columna. */
export interface RegionTablero {
  filaMin: number;
  filaMax: number;
  columnaMin: number;
  columnaMax: number;
}

/** Intersecciones de aire que se dejan alrededor de lo que hay en el desafío. */
const MARGEN_REGION = 2;
/** Lado mínimo de la ventana, para que un desafío chico no se amplíe más que uno de 9x9. */
const LADO_MIN_REGION = 9;

function puntosDeSecuencia(nodo: NodoSecuencia): Punto[] {
  return nodo.ramas.flatMap((rama) => [
    rama.en,
    ...(rama.respuestaRival ? [rama.respuestaRival] : []),
    ...rama.marcas.map((m): Punto => [m.r, m.c]),
    ...(rama.siguiente ? puntosDeSecuencia(rama.siguiente) : []),
  ]);
}

/**
 * Ventana de la grilla que contiene todo lo que el desafío puede mostrar o pedir tocar (piedras,
 * marcas, jugadas correctas, desenlaces, ramas de la secuencia, ayuda) más un margen. Es cuadrada y
 * depende solo del desafío, no del estado de juego, así que no cambia mientras el estudiante juega.
 * Devuelve null cuando la ventana cubriría casi todo el tablero (no hay nada que recortar).
 */
export function regionDeDesafio(desafio: Desafio): RegionTablero | null {
  const n = desafio.tamañoTablero;
  const puntos: Punto[] = [
    ...desafio.piedras.map((p): Punto => [p.r, p.c]),
    ...desafio.marcas.map((m): Punto => [m.r, m.c]),
    ...(desafio.jugadasCorrectas ?? []),
    ...(desafio.piedrasMuertas ?? []),
    ...(desafio.ayuda ? [desafio.ayuda] : []),
    ...(desafio.desenlaces ?? []).flatMap((d) => [d.en, ...d.marcas.map((m): Punto => [m.r, m.c])]),
    ...(desafio.secuencia ? puntosDeSecuencia(desafio.secuencia) : []),
  ];
  if (!puntos.length) return null;

  const filas = puntos.map(([r]) => r);
  const columnas = puntos.map(([, c]) => c);
  const [filaMin, filaMax] = [Math.min(...filas), Math.max(...filas)];
  const [columnaMin, columnaMax] = [Math.min(...columnas), Math.max(...columnas)];

  const lado = Math.max(filaMax - filaMin, columnaMax - columnaMin) + 1 + 2 * MARGEN_REGION;
  const ladoVentana = Math.max(lado, LADO_MIN_REGION);
  if (ladoVentana >= n - 1) return null;

  // Centrada en lo que hay, y corrida hacia adentro si se sale del tablero.
  const inicio = (min: number, max: number) =>
    Math.min(Math.max(Math.round((min + max - (ladoVentana - 1)) / 2), 0), n - ladoVentana);
  const filaIni = inicio(filaMin, filaMax);
  const colIni = inicio(columnaMin, columnaMax);
  return {
    filaMin: filaIni,
    filaMax: filaIni + ladoVentana - 1,
    columnaMin: colIni,
    columnaMax: colIni + ladoVentana - 1,
  };
}
