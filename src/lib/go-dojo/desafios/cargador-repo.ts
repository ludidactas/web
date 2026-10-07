import { ErrorParseoDesafio, parsearDesafios, verificarIdsUnicos } from "./cargador";
import type { Desafio } from "../tipos";

/**
 * Carga de desafíos desde un repo público de GitHub (ej. la colección `ogs-desafios`). Lista los
 * archivos con la API de git trees (una request) y baja cada .yaml de raw.githubusercontent.com.
 *
 * Usa solo `fetch`: sirve desde un Server Component, un Route Handler o un script. En Next, las
 * respuestas se cachean `revalidarSegundos` (default 1 hora), así que la colección se actualiza
 * sola al publicar cambios en el repo sin pegarle a GitHub en cada request.
 */

export interface RepoPublico {
  owner: string;
  repo: string;
  /** Rama, tag o sha. Default: `main`. */
  ref?: string;
}

export interface OpcionesRepoPublico {
  /** Directorio del repo desde el que cargar (ej. `01-fundamentals`). Default: la raíz. */
  ruta?: string;
  /** Incluye también los .yaml de los subdirectorios. Default: `false`. */
  recursivo?: boolean;
  /** Segundos que Next cachea cada respuesta. Default: 3600. */
  revalidarSegundos?: number;
  /**
   * Token de GitHub (default: `GITHUB_TOKEN` del entorno). Opcional: sin token la API de listado
   * admite 60 requests/hora por IP, que alcanza con la caché pero no con un server compartido.
   */
  token?: string;
  /** Para inyectar otro `fetch` (tests). Default: el global. */
  fetch?: typeof fetch;
}

/** Cuántos .yaml se bajan en paralelo. */
const DESCARGAS_SIMULTANEAS = 8;

const esYaml = (ruta: string) => ruta.endsWith(".yaml") || ruta.endsWith(".yml");

/** Normaliza `ruta` a "a/b" (sin barras de borde). */
const sinBarras = (ruta: string) => ruta.replace(/^\/+|\/+$/g, "");

interface EntradaArbol {
  path: string;
  type: string;
}

/** Última carga exitosa de cada (repo, ref, ruta), en memoria del proceso. Ver `cargarDesafiosDesdeRepoPublico`. */
const ultimaVersionBuena = new Map<string, Desafio[]>();

/** Olvida las últimas versiones buenas (para tests). */
export function vaciarUltimasVersionesBuenas() {
  ultimaVersionBuena.clear();
}

/**
 * Descarga y valida los .yaml de `ruta` en el repo, y devuelve la lista combinada y aplanada de
 * desafíos, en orden alfabético de archivo (así `01-…`, `02-…` se respetan).
 *
 * Si la carga falla (GitHub caído o limitando, o un push con YAML inválido) y este proceso ya cargó
 * antes esa misma ruta, devuelve la última versión buena y deja un `console.warn`. Sin una carga
 * previa en el proceso (arranque en frío, primer request) el error se propaga.
 */
export async function cargarDesafiosDesdeRepoPublico(
  repo: RepoPublico,
  opciones: OpcionesRepoPublico = {}
): Promise<Desafio[]> {
  const clave = `${repo.owner}/${repo.repo}@${repo.ref ?? "main"}:${sinBarras(opciones.ruta ?? "")}:${!!opciones.recursivo}`;
  try {
    const desafios = await descargarDesafios(repo, opciones);
    ultimaVersionBuena.set(clave, desafios);
    return desafios;
  } catch (err) {
    const respaldo = ultimaVersionBuena.get(clave);
    if (!respaldo) throw err;
    console.warn(`⚠️ No pude actualizar los desafíos de ${clave}; sirvo la última versión buena.`, err);
    return respaldo;
  }
}

async function descargarDesafios(
  { owner, repo, ref = "main" }: RepoPublico,
  opciones: OpcionesRepoPublico
): Promise<Desafio[]> {
  const { recursivo = false, revalidarSegundos = 3600 } = opciones;
  const hacerFetch = opciones.fetch ?? fetch;
  const token = opciones.token ?? process.env.GITHUB_TOKEN;
  const ruta = sinBarras(opciones.ruta ?? "");
  const origen = `${owner}/${repo}@${ref}`;

  const pedir = async (url: string, headers: Record<string, string> = {}) => {
    const res = await hacerFetch(url, {
      headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      // Opción de Next.js (se ignora fuera de Next): caché de la respuesta.
      next: { revalidate: revalidarSegundos },
    } as RequestInit);
    if (!res.ok) {
      const limite = res.status === 403 || res.status === 429 ? " (¿límite de requests de GitHub? probá con GITHUB_TOKEN)" : "";
      throw new ErrorParseoDesafio(`GitHub respondió ${res.status} al pedir ${url}${limite}`, origen);
    }
    return res;
  };

  // 1. Listado de archivos del repo.
  const arbol = await (
    await pedir(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      { Accept: "application/vnd.github+json" }
    )
  ).json() as { tree: EntradaArbol[]; truncated?: boolean };

  if (arbol.truncated) {
    throw new ErrorParseoDesafio(`El repo ${origen} es demasiado grande para listarlo de una vez.`, origen);
  }

  const prefijo = ruta ? `${ruta}/` : "";
  const archivos = arbol.tree
    .filter((e) => e.type === "blob" && e.path.startsWith(prefijo) && esYaml(e.path))
    .map((e) => e.path)
    .filter((p) => recursivo || !p.slice(prefijo.length).includes("/"))
    .sort();

  if (archivos.length === 0) {
    throw new ErrorParseoDesafio(`No encontré archivos .yaml en ${origen}${ruta ? `/${ruta}` : ""}.`, origen);
  }

  // 2. Descarga y parseo, de a DESCARGAS_SIMULTANEAS. `porArchivo` conserva el orden alfabético.
  const porArchivo: Desafio[][] = new Array(archivos.length);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < archivos.length) {
      const i = siguiente++;
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${archivos[i]}`;
      const texto = await (await pedir(url)).text();
      porArchivo[i] = parsearDesafios(texto, archivos[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(DESCARGAS_SIMULTANEAS, archivos.length) }, trabajador));

  const todos = porArchivo.flat();
  verificarIdsUnicos(todos);
  return todos;
}
