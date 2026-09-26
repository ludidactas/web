import { basename } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verificarIdsUnicos, parsearDesafios } from "./cargador";
import type { Desafio } from "../tipos";

/**
 * Carga de desafíos directo desde el filesystem — la mitad Node-only de `cargador.ts` (separada para
 * que ese otro archivo, puro, se pueda importar desde código cliente sin arrastrar `node:fs`).
 */

/**
 * Lee un único archivo .yaml, lo parsea y valida. Para una colección de desafíos que vive en su
 * propio archivo (ej. `desafios-de-ejemplo.yaml`) — ver `cargarDesafiosDesdeDirectorio` si en cambio
 * la colección está repartida en varios archivos de un mismo directorio.
 *
 * Solo Node — llamalo desde un Server Component, un Route Handler, o un script de build, nunca desde
 * un Client Component.
 */
export function cargarDesafiosDesdeArchivo(filePath: string): Desafio[] {
  const text = readFileSync(filePath, "utf-8");
  const desafios = parsearDesafios(text, basename(filePath));
  verificarIdsUnicos(desafios);
  return desafios;
}

/**
 * Lee cada archivo .yml/.yaml de `dirPath`, parsea y valida cada uno, y
 * devuelve la lista combinada y aplanada de desafíos.
 *
 * Solo Node — llamalo desde un Server Component, un Route Handler, o un
 * script de build, nunca desde un Client Component.
 */
export function cargarDesafiosDesdeDirectorio(dirPath: string): Desafio[] {
  const files = readdirSync(dirPath).filter(
    (f) => f.endsWith(".yml") || f.endsWith(".yaml")
  );

  const all: Desafio[] = [];
  for (const file of files) {
    const text = readFileSync(join(dirPath, file), "utf-8");
    all.push(...parsearDesafios(text, file));
  }

  verificarIdsUnicos(all);
  return all;
}
