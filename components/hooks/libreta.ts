import LibretaContext from '@/components/context/libreta'
import materias, { esMateria, Materia } from '@/md'
import { Nivel, nivelEnum } from '@/md/schema'
import { useContext } from 'react'
import { entries, find, first, fromEntries, isPlainObject, isString } from 'remeda'

export interface Requerimiento {
  materia: Materia
  nivel?: Nivel | null
  unidad?: string
  pendiente?: boolean
}

const useLibreta = () => {
  // Datasource
  const { libreta, setLibreta } = useContext(LibretaContext)

  /**
   * Activa o desactiva todas las unidades listadas bajo un nivel en el meta de la materia
   */
  const toggleNivel = (materia: Materia, nivel: Nivel) => {
    // Accedemos a los niveles de esa materia
    const niveles = materias[materia].meta.niveles
    if (!niveles || !niveles[nivel]) return

    // Creamos un objecto cuyas claves sean materia.unidad para cada unidad de ese nivel
    // y sus valores lo opuesto del actual valor de `nivelCompletado`
    const estadoNivel = nivelCompletado(materia, nivel)
    const unidadesUpdateadas = fromEntries(niveles[nivel].map((unid) => [`${materia}.${unid}`, !estadoNivel]))
    setLibreta({ ...libreta, ...unidadesUpdateadas })
  }

  /**
   * Activa o desactiva una unidad en la libreta
   */
  const toggleUnidad = (materia: Materia, unidad: string) => {
    // Si la unidad aún no está en la libreta, la creamos en true
    const clave = `${materia}.${unidad}`
    if (libreta[clave] === undefined) return setLibreta({ ...libreta, [clave]: true })
    setLibreta({ ...libreta, [clave]: !libreta[clave] })
  }

  /**
   * Averigua si todas las unidades de un nivel dado están marcadas
   */
  const nivelCompletado = (materia: Materia, nivel: Nivel) => {
    const niveles = materias[materia].meta.niveles
    if (!niveles || !niveles[nivel]) return

    return niveles[nivel].reduce((acc, unid) => acc && libreta[`${materia}.${unid}`], true)
  }

  /**
   * Averigua si al menos una unidad del nivel dado está marcada
   */
  const nivelParcial = (materia: Materia, nivel: Nivel) => {
    const niveles = materias[materia].meta.niveles
    if (!niveles || !niveles[nivel]) return

    return niveles[nivel].some((unid) => libreta[`${materia}.${unid}`])
  }

  /**
   * Devuelve las unidades propias de un cierto nivel
   */
  const unidadesDeNivel = (materia: Materia, nivel: Nivel) => {
    const niveles = materias[materia].meta.niveles
    const unidades = materias[materia].meta.unidades
    if (!unidades || !niveles || !niveles[nivel]) return

    return fromEntries(niveles[nivel].map((u) => [u, unidades[u]]))
  }

  /**
   * Devuelve el nivel de una unidad
   */
  const nivelDeUnidad = (materia: Materia, unidad: string) => {
    const niveles = materias[materia].meta.niveles
    const unidades = materias[materia].meta.unidades
    if (!unidades || !niveles) return null

    const [nv, unids] = find(entries(niveles), ([nv, unids]) => unids.includes(unidad)) ?? [null, null]
    return nv
  }

  /**
   * Devuelve los requerimientos de una unidad según las entradas del `requiere` del meta de la materia
   */
  const requerimientos = (materia: Materia, unidad: string): Requerimiento[] | null => {
    const niveles = materias[materia].meta.niveles
    const unidades = materias[materia].meta.unidades
    const requiere = materias[materia].meta.requiere
    if (!unidades || !niveles || !requiere) return null

    // console.log(`Averiguando requerimientos de ${unidad} (${materia})...`)
    if (!Object.keys(unidades).includes(unidad)) {
      console.warn(`Se solicitaron los requerimientos de unidad ${unidad} de ${materia}, pero no se encuentra listada`)
      return []
    }
    if (!requiere) {
      // console.log(`...not tiene c:`)
      return []
    }

    // Lógica para determinar los requerimientos
    const requerimientos = []

    // Primero nos enteramos de qué nivel es la unidad que estamos tratando (podría no ser de ninguno también - null)
    const nivelUnidad = nivelDeUnidad(materia, unidad)
    // console.log(`...que es de nivel ${nivelUnidad}...`)

    // Requerimientos de materia: Una materia depende enteramente de otra
    // Si una materia A tiene listada a otra B como dependencia, significa que cada nivel de A tiene como requerimiento
    // el nivel correspondiente de B, es decir, que cada unidad de ese nivel en A tendrá como requerimiento todas las unidades
    // del mismo nivel en B
    const requerimientosMateria = requiere.filter((r) => isString(r))
    if (requerimientosMateria)
      if (!nivelDeUnidad) {
        console.warn(`${materia} requiere ${requerimientosMateria.join(', ')} pero su unidad ${unidad} no tiene nivel`)
        return []
      } else {
        for (const materia of requerimientosMateria) {
          if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)
          // console.log(`...agregando requerimiento de materia a ${materia} (o sea [${materia}.${nivelUnidad}])...`)
          requerimientos.push({ materia, nivel: nivelUnidad })
        }
      }

    // Requerimientos de nivel: Un nivel de una materia depende de un nivel o una cierta unidad en otra
    // nivel: otramateria.nivel
    // nivel: otramateria.unidad
    const requerimientosDeNivel = requiere.filter(
      (r) => isPlainObject(r) && Object.keys(r).length == 1 && first(Object.keys(r)) == nivelUnidad
    )
    if (requerimientosDeNivel)
      for (const req of requerimientosDeNivel) {
        const dependencia = first(Object.values(req))!
        const [materia, nivelOUnidad] = dependencia.split('.')

        if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)

        if (nivelEnum.parse(nivelOUnidad)) {
          // console.log(`...agregando requerimiento de nivel a nivel [${materia}.${nivelOUnidad}]...`)
          requerimientos.push({ materia, nivel: nivelOUnidad as Nivel })
        } else {
          // console.log(`...agregando requerimiento de nivel a unidad [${materia}.${nivelOUnidad}]...`)
          requerimientos.push({ materia, unidad: nivelOUnidad })
        }
      }

    // Requerimientos de unidad: una unidad de una materia depende de un nivel o una cierta unidad en otra
    // nivel.unidad: otramateria.nivel
    // nivel.unidad: otramateria.unidad
    const requerimientosDeUnidad = requiere.filter(
      (r) => isPlainObject(r) && Object.keys(r).length == 1 && first(Object.keys(r))!.includes('.')
    )
    if (requerimientosDeUnidad)
      for (const req of requerimientosDeUnidad) {
        const dependencia = first(Object.values(req))!
        const [materia, nivelOUnidad] = dependencia.split('.')

        if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)

        if (nivelEnum.parse(nivelOUnidad)) {
          // console.log(`...agregando requerimiento de unidad a nivel [${materia}.${nivelOUnidad}]...`)
          requerimientos.push({ materia, nivel: nivelOUnidad as Nivel })
        } else {
          // console.log(`...agregando requerimiento de unidad a unidad [${materia}.${nivelOUnidad}]...`)
          requerimientos.push({ materia, unidad: nivelOUnidad })
        }
      }

    // console.log(`Devolviendo `, requerimientos)
    return requerimientos
  }

  /**
   * Extiende la info de los requerimientos de unidad con el campo `pendiente`, booleando dependiendo de  si está o no en la libreta.
   */
  const requerimientosPendientes = (materia: Materia, unidad: string) => {
    const reqs = requerimientos(materia, unidad)
    if (!reqs) return

    console.log(`Computando pendientes de ${materia}.${unidad}, partiendo de reqs `, reqs)
    reqs.forEach((r) => {
      console.log(`Evaluando req `, r, `: `)
      if (r.nivel) {
        console.log(`Es de nivel, checkeando si está completado... `, nivelCompletado(r.materia as Materia, r.nivel))
      } else {
        console.log(`Es de unidad, checkeando si está completada...`, libreta[`${r.materia}.${r.unidad}`] ?? false)
      }
    })
    console.log(
      reqs.map((req) => ({
        ...req,
        pendiente: req.nivel
          ? !nivelCompletado(req.materia as Materia, req.nivel)
          : libreta[`${req.materia}.${req.unidad}`] ?? true,
      }))
    )
    return reqs.map((req) => ({
      ...req,
      pendiente: req.nivel
        ? !nivelCompletado(req.materia as Materia, req.nivel)
        : libreta[`${req.materia}.${req.unidad}`] ?? true,
    }))
  }

  return {
    libreta,
    toggleNivel,
    toggleUnidad,
    nivelCompletado,
    nivelParcial,
    unidadesDeNivel,
    requerimientos,
    requerimientosPendientes,
  }
}

export default useLibreta
