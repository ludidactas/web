/**
 * Barrel público del dojo — todo lo isomórfico (tipos, lógica de juego pura, hook, componentes). Para
 * cargar contenido desde YAML/disco, importá `./desafios` aparte (ese sí depende de `node:fs`).
 */

// Tipos y schema — el contrato que debe cumplir el YAML de los content creators.
export {
  DesafioSchema,
  ArchivoDesafiosSchema,
  PiedraSchema,
  ColorPiedraSchema,
  PuntoSchema,
  TipoMarcaSchema,
  MarcaSchema,
  DesenlaceSchema,
  RamaSecuenciaSchema,
  NodoSecuenciaSchema,
} from "./tipos";
export type {
  Desafio,
  ArchivoDesafios,
  Piedra,
  Color,
  Punto,
  ResultadoEvaluacion,
  TipoMarca,
  Marca,
  Desenlace,
  RamaSecuencia,
  NodoSecuencia,
} from "./tipos";

// Lógica de juego pura — usable también fuera de React (ej. para validar contenido en un script/CI).
export { rival } from "@/lib/go/motor";
export {
  calcularCapturas,
  aplicarJugada,
  evaluarJugada,
  esJugadaCorrecta,
  estaOcupado,
  puntoDeAyuda,
  clavePunto,
  puntoDesdeClave,
} from "./motor-desafio";

// Parseo de YAML (seguro para cliente o server — no usa fs). Para cargar
// directo desde disco en el server, importá cargarDesafiosDesdeDirectorio de "./desafios/cargador-fs".
export { parsearDesafios, verificarIdsUnicos, ErrorParseoDesafio } from "./desafios/cargador";

// Hook de React + componentes.
export { useDesafioGo } from "./components/use-desafio-go";
export type { ResultadoDesafioGo, EstadoDesafioGo, EstadoDesafio } from "./components/use-desafio-go";
export { DesafioDojoGo, DEFAULT_DESAFIO_DOJO_GO_THEME } from "./components/desafio-dojo-go";
export type { DesafioDojoGoProps, DesafioDojoGoTheme } from "./components/desafio-dojo-go";
export { TarjetaDesafioGo } from "./components/tarjeta-desafio-go";
export type { TarjetaDesafioGoProps } from "./components/tarjeta-desafio-go";
export { ConjuntoDesafios } from "./components/conjunto-desafios";
export type { ConjuntoDesafiosProps } from "./components/conjunto-desafios";
