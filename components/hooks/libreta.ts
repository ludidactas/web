import { useContext } from 'react'
import { entries, find, first, fromEntries, isPlainObject, isString } from 'remeda'
import LibretaContext from '../context/libreta'
import { getArticulo } from '@/md'
import { Nivel, nivelEnum } from '@/md/schema'

export enum Materia {
  Math = 'matematica',
  Programacion = 'programacion',
  Gaming = 'gaming',
}

const useLibreta = (materia: Materia) => {
  // Datasource
  const { libreta, setLibreta } = useContext(LibretaContext)

  // Pulleamos los datos de la materia
  const { meta } = getArticulo(materia)
  const unidades = meta?.unidades
  const niveles = meta?.niveles
  const requiere = meta?.requiere

  if (!unidades || !niveles) throw new Error(`Faltan o unidades o niveles de ${materia}`)

  /**
   * Activa o desactiva todas las unidades listadas bajo un nivel en el meta de la materia
   */
  const toggleNivel = (nivel: Nivel) => {
    if (!niveles || !niveles[nivel]) return
    const unidadesUpdateadas = fromEntries(niveles[nivel].map((nv) => [nv, !nivelCompletado(nivel)]))
    setLibreta({ ...libreta, ...unidadesUpdateadas })
  }

  /**
   * Activa o desactiva una unidad en la libreta
   */
  const toggleUnidad = (unidad: string) => {
    if (!libreta[unidad]) return setLibreta({ ...libreta, [unidad]: true })
    setLibreta({ ...libreta, [unidad]: !libreta[unidad] })
  }

  /**
   * Averigua si todas las unidades de un nivel dado están marcadas
   */
  const nivelCompletado = (nivel: Nivel) =>
    niveles[nivel] && niveles[nivel].reduce((acc, unid) => acc && libreta[unid], true)

  /**
   * Averigua si al menos una unidad del nivel dado está marcada
   */
  const nivelParcial = (nivel: Nivel) => niveles[nivel] && niveles[nivel].some((unid) => libreta[unid])

  /**
   * Devuelve las unidades propias de un cierto nivel
   */
  const unidadesDeNivel = (nivel: Nivel) => niveles[nivel] && fromEntries(niveles[nivel].map((u) => [u, unidades[u]]))

  /**
   * Devuelve el nivel de una unidad
   */
  const nivelDeUnidad = (unidad: string) => {
    if (!unidades[unidad])
      throw new Error(`La supuesta unidad ${unidad} de ${materia} no está en la lista de unidades!`)
    if (!niveles) return null
    const [nv, unids] = find(entries(niveles), ([nv, unids]) => unids.includes(unidad)) ?? [null, null]
    return nv
  }

  const requerimientosPendientes = (unidad: string) => {
    if (!Object.keys(unidades).includes(unidad)) {
      console.warn(`Se solicitaron los requerimientos de unidad ${unidad} de ${materia}, pero no se encuentra listada`)
      return []
    }
    if (!requiere || !requiere) {
      return []
    }

    // Lógica para determinar los requerimientos
    const requerimientos = []

    // Primero nos enteramos de qué nivel es la unidad que estamos tratando (podría no ser de ninguno también - null)
    const nivelUnidad = nivelDeUnidad(unidad)

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
        for (const materia of requerimientosMateria) requerimientos.push({ materia: materia, nivel: nivelUnidad })
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
        if (nivelEnum.parse(nivelOUnidad)) requerimientos.push({ materia, nivel: nivelOUnidad })
        else requerimientos.push({ materia, unidad: nivelOUnidad })
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
        if (nivelEnum.parse(nivelOUnidad)) requerimientos.push({ materia, nivel: nivelOUnidad })
        else requerimientos.push({ materia, unidad: nivelOUnidad })
      }

    return requerimientos
  }

  return {
    libreta,
    unidades,
    niveles,
    toggleNivel,
    toggleUnidad,
    nivelCompletado,
    nivelParcial,
    unidadesDeNivel,
    requerimientosPendientes,
  }
}

export default useLibreta
