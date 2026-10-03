import { useCallback, useMemo, useState } from "react";
import { rival } from "@/lib/go/motor";
import {
  aplicarJugada,
  retirarGrupo,
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
  /** Cuántas piedras rivales capturó la última jugada del estudiante (las que capture la respuesta automática del rival en tipo `secuencia` no cuentan). */
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
  /** Adónde debería apuntar el botón "Ayuda": estático para "jugada", dinámico (la rama correcta del nodo actual del árbol) para "secuencia", el primer grupo todavía en pie para "retirar", null para "exploracion" (nada que ayudar — cada punto ya está marcado) y "opciones" (no hay punto). */
  puntoDeAyuda: Punto | null;
  /** Índice de la opción que eligió el estudiante en un desafío `tipo: "opciones"`, o null si todavía no eligió. */
  opcionElegida: number | null;
}

export interface ResultadoDesafioGo extends EstadoDesafioGo {
  /** Llamalo con la (fila, columna) que clickeó el estudiante en el tablero. No hace nada si ya respondió o el punto es ilegal. En `tipo: "retirar"` es el toque sobre una piedra. */
  jugar: (r: number, c: number) => void;
  /** Elige la opción `indice` de un desafío `tipo: "opciones"`. No hace nada si ya eligió una. */
  elegirOpcion: (indice: number) => void;
  reiniciar: () => void;
  mostrarAyuda: () => void;
  mostrarExplicacion: () => void;
  /** True una vez que el estudiante respondió (o, para "secuencia", llegó a una rama terminal) — se usa para deshabilitar más clicks. Siempre false para "exploracion". */
  respondido: boolean;
}

/**
 * Maneja el estado de jugar/reiniciar/ayuda/explicación de un Desafio para
 * los cinco tipos de interacción ("jugada", "exploracion", "secuencia", "opciones", "retirar"). No toca el
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
  // Estado exclusivo de "retirar" y "opciones", con la misma salvedad que el de "secuencia".
  const [piedrasRetirar, setPiedrasRetirar] = useState<Piedra[]>(desafio.piedras);
  const [opcionElegida, setOpcionElegida] = useState<number | null>(null);

  const respondido =
    desafio.tipo === "secuencia"
      ? estado === "correcto" || estado === "incorrecto"
      : desafio.tipo === "retirar"
        ? estado === "correcto"
        : desafio.tipo === "opciones"
          ? opcionElegida !== null
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
        const capturadasIntercambio = trasEstudiante.capturadas;

        // La respuesta del rival se muestra si la línea continúa, o como refutación en una rama
        // terminal incorrecta; una rama terminal correcta termina con la jugada del estudiante.
        if (rama.respuestaRival && (rama.siguiente || !rama.correcto)) {
          const [rr, rc] = rama.respuestaRival;
          const trasRival = aplicarJugada(siguientesPiedras, rr, rc, rival(desafio.turno), desafio.tamañoTablero);
          siguientesPiedras = trasRival.piedras;
        }

        setPiedrasSecuencia(siguientesPiedras);
        if (rama.siguiente) {
          setNodoSecuencia(rama.siguiente);
          setEstado("jugando");
        } else {
          setEstado(rama.correcto ? "correcto" : "incorrecto");
        }

        setJugadaJugador([r, c]);
        setCapturadas(capturadasIntercambio);
        setTextoActivo(rama.texto);
        setMarcasActivas(rama.marcas);
        return;
      }

      if (desafio.tipo === "opciones") return; // se responde con `elegirOpcion`, no sobre el tablero

      if (desafio.tipo === "retirar") {
        if (estado === "correcto") return;
        const resultado = retirarGrupo(desafio, piedrasRetirar, r, c);
        if (!resultado) return; // punto vacío: no hay nada que retirar
        if (!resultado.muerta) {
          setEstado("incorrecto"); // no traba: el estudiante sigue buscando los grupos muertos
          setTextoActivo(desafio.mensajeError ?? "Esa piedra está viva: buscá las que ya no pueden salvarse.");
          return;
        }
        setPiedrasRetirar(resultado.piedras);
        setEstado(resultado.completo ? "correcto" : "jugando");
        setTextoActivo(
          resultado.completo
            ? desafio.mensajeExito ?? "Correcto! Bien jugado."
            : "Bien, esas piedras estaban muertas. Todavía queda algún grupo por retirar."
        );
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
    [desafio, estado, nodoSecuencia, piedrasSecuencia, piedrasRetirar, respondido]
  );

  const elegirOpcion = useCallback(
    (indice: number) => {
      if (desafio.tipo !== "opciones" || opcionElegida !== null) return;
      const opcion = desafio.opciones?.[indice];
      if (!opcion) return;
      setOpcionElegida(indice);
      setEstado(opcion.correcta ? "correcto" : "incorrecto");
      setTextoActivo(opcion.retro ?? null);
    },
    [desafio, opcionElegida]
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
    setPiedrasRetirar(desafio.piedras);
    setOpcionElegida(null);
  }, [desafio]);

  const mostrarAyuda = useCallback(() => {
    setAyudaVisible(true);
    const timer = setTimeout(() => setAyudaVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const mostrarExplicacion = useCallback(() => setExplicacionVisible(true), []);

  const piedras = useMemo<Piedra[]>(() => {
    if (desafio.tipo === "secuencia") return piedrasSecuencia;
    if (desafio.tipo === "retirar") return piedrasRetirar;
    if (desafio.tipo === "exploracion" || desafio.tipo === "opciones") return desafio.piedras;
    const base = desafio.piedras.filter((p) => !capturadas.has(clavePunto(p.r, p.c)));
    if (jugadaJugador) {
      base.push({ r: jugadaJugador[0], c: jugadaJugador[1], color: desafio.turno });
    }
    return base;
  }, [desafio.tipo, desafio.piedras, desafio.turno, capturadas, jugadaJugador, piedrasSecuencia, piedrasRetirar]);

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
    if (desafio.tipo === "exploracion" || desafio.tipo === "opciones") return null;
    if (desafio.tipo === "retirar") {
      if (desafio.ayuda) return desafio.ayuda;
      return desafio.piedrasMuertas?.find(([r, c]) => estaOcupado(piedrasRetirar, r, c)) ?? null;
    }
    if (desafio.tipo === "secuencia") {
      const nodo = nodoSecuencia ?? desafio.secuencia;
      const ramaCorrecta = nodo?.ramas.find((b) => b.correcto);
      return ramaCorrecta?.en ?? null;
    }
    return puntoDeAyudaEstatico(desafio);
  }, [desafio, nodoSecuencia, piedrasRetirar]);

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
    opcionElegida,
    respondido,
    jugar,
    elegirOpcion,
    reiniciar,
    mostrarAyuda,
    mostrarExplicacion,
  };
}
