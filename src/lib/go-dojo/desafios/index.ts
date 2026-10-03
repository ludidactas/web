import path from "node:path";
import { cargarDesafiosDesdeArchivo } from "./cargador-fs";
import { cargarDesafiosDesdeRepoPublico, type RepoPublico } from "./cargador-repo";
import type { Desafio } from "../tipos";

/**
 * Colecciones de desafíos, cada una en su propio archivo .yaml de esta carpeta. Las páginas del dojo
 * (ej. `/go/dojo`) importan la función de la colección que necesitan en vez de tener su propio
 * contenido en `app/` — agregar una colección nueva es sumar un `.yaml` acá y su `getDesafiosX()`.
 */
export function getDesafiosEjemplo(): Desafio[] {
  return cargarDesafiosDesdeArchivo(
    path.join(process.cwd(), "src/lib/go-dojo/desafios/contenido/desafios-de-ejemplo.yaml")
  );
}

/** Repo público con la colección de OGS: una carpeta por capítulo (`01-fundamentos`, …) y un .yaml por tema. */
export const REPO_DESAFIOS_OGS: RepoPublico = { owner: "ludidactas", repo: "desafios-ogs", ref: "main" };

/**
 * Desafíos de un capítulo de la colección de OGS (ver `NOTICE.md` y `LICENSE` en el repo), en el orden
 * de sus archivos. Se bajan de GitHub y Next los cachea (ver `cargarDesafiosDesdeRepoPublico`).
 */
export function getDesafiosOgs(capitulo: string): Promise<Desafio[]> {
  return cargarDesafiosDesdeRepoPublico(REPO_DESAFIOS_OGS, { ruta: capitulo });
}

/** Fundamentos del Go: reglas básicas, autocaptura, ojos, ko, territorio y tablero (`01-fundamentos`). */
export function getDesafiosFundamentos(): Promise<Desafio[]> {
  return getDesafiosOgs("01-fundamentos");
}

export { CAPITULOS_OGS, capituloOgsOInicial, type SlugCapituloOgs } from "./capitulos";
