import { useCallback, useMemo, useState } from "react";
import { rival } from "@/lib/go/motor";
import {
  aplicarJugada,
  evaluarJugada,
  puntoDeAyuda as puntoDeAyudaEstatico,
  estaOcupado,
  clavePunto,
} from "../motor-desafio";
import type { Desafio, Punto, Marca, NodoSecuencia, Piedra } from "../tipos";

export type EstadoDesafio = "inactivo" | "jugando" | "correcto" | "incorrecto";

export interface EstadoDesafioGo {
  /** Piedras a dibujar: el setup del desafío, evolucionado por lo que se jugó hasta ahora. */
  piedras: Piedra[];
  /** El punto que clickeó el estudiante por última vez, o null si todavía no respondió (sin uso en tipo "exploracion" — ahí nunca se "juega" nada). */
  jugadaJugador: Punto | null;
  /**
   * "inactivo": todavía no se jugó nada. "jugando": en medio de una `secuencia` —
   * una rama correcta llevó a otro nodo y sigue. "correcto"/"incorrecto": veredicto terminal.
   */
  estado: EstadoDesafio;
  /** Cuántas piedras rivales capturó el último intercambio (la jugada del estudiante, más la respuesta automática en tipo `secuencia`). */
  cantidadCapturas: number;
  /** True brevemente, para disparar la animación de la piedra fantasma de la ayuda. */
  ayudaVisible: boolean;
  explicacionVisible: boolean;
  /** Marcadores de jugada correcta a mostrar, solo poblados tras una respuesta incorrecta en un desafío `tipo: "jugada"`. */
  jugadasCorrectasReveladas: Punto[];
  /** Texto de feedback para el punto/rama que el estudiante está viendo — tiene prioridad sobre el mensajeExito/mensajeError genérico del desafío cuando está seteado (siempre seteado para "exploracion"/"secuencia", solo para "jugada" cuando define `desenlaces`). */
  textoActivo: string | null;
  /** `desafio.marcas` combinado con lo que revele el desenlace/rama actual. Pasalo directo a <DesafioDojoGo marks={...} />. */
  marcasVisibles: Marca[];
  /** Adónde debería apuntar el botón "Ayuda": estático para "jugada", dinámico (la rama correcta del nodo actual del árbol) para "secuencia", null para "exploracion" (nada que ayudar — cada punto ya está marcado). */
  puntoDeAyuda: Punto | null;
}

export interface ResultadoDesafioGo extends EstadoDesafioGo {
  /** Llamalo con la (fila, columna) que clickeó el estudiante en el tablero. No hace nada si ya respondió o el punto es ilegal. */
  jugar: (r: number, c: number) => void;
  reiniciar: () => void;
  mostrarAyuda: () => void;
  mostrarExplicacion: () => void;
  /** True una vez que el estudiante respondió (o, para "secuencia", llegó a una rama terminal) — se usa para deshabilitar más clicks. Siempre false para "exploracion". */
  respondido: boolean;
}

/**
 * Maneja el estado de jugar/reiniciar/ayuda/explicación de un Desafio para
 * los tres tipos de interacción ("jugada", "exploracion", "secuencia"). No toca el
 * DOM — combinalo con <DesafioDojoGo /> para renderizar.
 */
export function useDesafioGo(desafio: Desafio): ResultadoDesafioGo {
  const [jugadaJugador, setJugadaJugador] = useState<Punto | null>(null);
  const [capturadas, setCapturadas] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<EstadoDesafio>("inactivo");
  const [ayudaVisible, setAyudaVisible] = useState(false);
  const [explicacionVisible, setExplicacionVisible] = useState(false);
  const [textoActivo, setTextoActivo] = useState<string | null>(null);
  const [marcasActivas, setMarcasActivas] = useState<Marca[]>([]);

  // Estado exclusivo de "secuencia". Inofensivo inicializarlo para otros tipos —
  // simplemente nunca se lee ni se actualiza fuera de las ramas
  // `tipo === "secuencia"` de abajo. Los desafíos se remontan (por
  // `key={desafio.id}` en ConjuntoDesafios) en vez de intercambiarse in-place,
  // así que inicializar en frío desde `desafio` acá es seguro: esta
  // instancia del hook nunca ve un `desafio` distinto después de montar.
  const [nodoSecuencia, setNodoSecuencia] = useState<NodoSecuencia | null>(desafio.secuencia ?? null);
  const [piedrasSecuencia, setPiedrasSecuencia] = useState<Piedra[]>(desafio.piedras);

  const respondido =
    desafio.tipo === "secuencia"
      ? estado === "correcto" || estado === "incorrecto"
      : desafio.tipo === "exploracion"
        ? false
        : jugadaJugador !== null;

  const jugar = useCallback(
    (r: number, c: number) => {
      if (desafio.tipo === "secuencia") {
        if (estado === "correcto" || estado === "incorrecto") return;
        const nodo = nodoSecuencia ?? desafio.secuencia;
        if (!nodo || estaOcupado(piedrasSecuencia, r, c)) return;

        const rama = nodo.ramas.find((b) => b.en[0] === r && b.en[1] === c);

        if (!rama) {
          // No es una de las ramas escritas para este nodo: cualquier otro punto
          // legal es simplemente incorrecto, igual que un punto no listado en `desenlaces`.
          setJugadaJugador([r, c]);
          setCapturadas(new Set());
          setEstado("incorrecto");
          setTextoActivo(desafio.mensajeError ?? "Esa no es la jugada indicada.");
          setMarcasActivas([]);
          return;
        }

        const trasEstudiante = aplicarJugada(piedrasSecuencia, r, c, desafio.turno, desafio.tamañoTablero);
        let siguientesPiedras = trasEstudiante.piedras;
        let capturadasIntercambio = trasEstudiante.capturadas;

        if (rama.siguiente) {
          if (rama.respuestaRival) {
            const [rr, rc] = rama.respuestaRival;
            const trasRival = aplicarJugada(
              siguientesPiedras,
              rr,
              rc,
              rival(desafio.turno),
              desafio.tamañoTablero
            );
            siguientesPiedras = trasRival.piedras;
            capturadasIntercambio = new Set([...capturadasIntercambio, ...trasRival.capturadas]);
          }
          setPiedrasSecuencia(siguientesPiedras);
          setNodoSecuencia(rama.siguiente);
          setEstado("jugando");
        } else {
          setPiedrasSecuencia(siguientesPiedras);
          setEstado(rama.correcto ? "correcto" : "incorrecto");
        }

        setJugadaJugador([r, c]);
        setCapturadas(capturadasIntercambio);
        setTextoActivo(rama.texto);
        setMarcasActivas(rama.marcas);
        return;
      }

      if (desafio.tipo === "exploracion") {
        const resultado = evaluarJugada(desafio, r, c);
        if (!resultado?.desenlace) return; // fuera del tablero, ocupado, o no es uno de los puntos marcados — no hay nada que mostrar
        setTextoActivo(resultado.desenlace.texto);
        setMarcasActivas(resultado.desenlace.marcas);
        setEstado(resultado.esCorrecta ? "correcto" : "incorrecto"); // solo define el color del banner — no traba
        return;
      }

      // tipo: "jugada" (default)
      if (respondido) return;
      const resultado = evaluarJugada(desafio, r, c);
      if (!resultado) return;
      setJugadaJugador(resultado.jugada);
      setCapturadas(resultado.capturadas);
      setEstado(resultado.esCorrecta ? "correcto" : "incorrecto");
      setTextoActivo(resultado.desenlace?.texto ?? null);
      setMarcasActivas(resultado.desenlace?.marcas ?? []);
    },
    [desafio, estado, nodoSecuencia, piedrasSecuencia, respondido]
  );

  const reiniciar = useCallback(() => {
    setJugadaJugador(null);
    setCapturadas(new Set());
    setEstado("inactivo");
    setAyudaVisible(false);
    setExplicacionVisible(false);
    setTextoActivo(null);
    setMarcasActivas([]);
    if (desafio.tipo === "secuencia") {
      setNodoSecuencia(desafio.secuencia ?? null);
      setPiedrasSecuencia(desafio.piedras);
    }
  }, [desafio]);

  const mostrarAyuda = useCallback(() => {
    setAyudaVisible(true);
    const timer = setTimeout(() => setAyudaVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const mostrarExplicacion = useCallback(() => setExplicacionVisible(true), []);

  const piedras = useMemo<Piedra[]>(() => {
    if (desafio.tipo === "secuencia") return piedrasSecuencia;
    if (desafio.tipo === "exploracion") return desafio.piedras;
    const base = desafio.piedras.filter((p) => !capturadas.has(clavePunto(p.r, p.c)));
    if (jugadaJugador) {
      base.push({ r: jugadaJugador[0], c: jugadaJugador[1], color: desafio.turno });
    }
    return base;
  }, [desafio.tipo, desafio.piedras, desafio.turno, capturadas, jugadaJugador, piedrasSecuencia]);

  const cantidadCapturas = capturadas.size;

  const jugadasCorrectasReveladas = useMemo<Punto[]>(() => {
    if (desafio.tipo !== "jugada" || estado !== "incorrecto") return [];
    if (desafio.jugadasCorrectas?.length) return desafio.jugadasCorrectas;
    return (desafio.desenlaces ?? []).filter((d) => d.correcto).map((d) => d.en);
  }, [desafio.tipo, desafio.jugadasCorrectas, desafio.desenlaces, estado]);

  const marcasVisibles = useMemo<Marca[]>(
    () => [...desafio.marcas, ...marcasActivas],
    [desafio.marcas, marcasActivas]
  );

  const puntoDeAyudaDinamico = useMemo<Punto | null>(() => {
    if (desafio.tipo === "exploracion") return null;
    if (desafio.tipo === "secuencia") {
      const nodo = nodoSecuencia ?? desafio.secuencia;
      const ramaCorrecta = nodo?.ramas.find((b) => b.correcto);
      return ramaCorrecta?.en ?? null;
    }
    return puntoDeAyudaEstatico(desafio);
  }, [desafio, nodoSecuencia]);

  return {
    piedras,
    jugadaJugador,
    estado,
    cantidadCapturas,
    ayudaVisible,
    explicacionVisible,
    jugadasCorrectasReveladas,
    textoActivo,
    marcasVisibles,
    puntoDeAyuda: puntoDeAyudaDinamico,
    respondido,
    jugar,
    reiniciar,
    mostrarAyuda,
    mostrarExplicacion,
  };
}
