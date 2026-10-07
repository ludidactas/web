/**
 * Capítulos de la colección de OGS (`ludidactas/desafios-ogs`): `slug` es el nombre de su carpeta en
 * el repo. Sin dependencias de Node, así que se puede importar desde código cliente.
 */
/** Identifica a la colección de OGS donde se guarda su progreso; los slugs de capítulo solo son únicos dentro de una colección. */
export const COLECCION_OGS = "ogs";

export const CAPITULOS_OGS = [
  { slug: "01-fundamentos", titulo: "Fundamentos" },
  { slug: "02-principios-basicos", titulo: "Principios básicos" },
  { slug: "03-habilidades-basicas", titulo: "Habilidades básicas" },
  { slug: "04-principiante-1", titulo: "Principiante, nivel 1" },
  { slug: "05-principiante-2", titulo: "Principiante, nivel 2" },
  { slug: "06-principiante-3", titulo: "Principiante, nivel 3" },
  { slug: "07-principiante-4", titulo: "Principiante, nivel 4" },
] as const;

export type SlugCapituloOgs = (typeof CAPITULOS_OGS)[number]["slug"];

/** Capítulo con el que arranca el dojo. */
export const CAPITULO_OGS_INICIAL: SlugCapituloOgs = "01-fundamentos";

/** El capítulo pedido si existe en la colección; si no, el inicial. */
export function capituloOgsOInicial(slug: string | undefined): SlugCapituloOgs {
  return CAPITULOS_OGS.find((c) => c.slug === slug)?.slug ?? CAPITULO_OGS_INICIAL;
}
