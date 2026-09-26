import path from "node:path";
import { cargarDesafiosDesdeArchivo } from "./cargador-fs";
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
