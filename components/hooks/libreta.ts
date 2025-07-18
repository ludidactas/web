import LibretaContext from '@/components/roadmaps/libreta'
import { Nivel, nivelEnum } from '@/md/schema'
import { useContext } from 'react'
import { entries, find, first, fromEntries, isPlainObject, isString } from 'remeda'
import { useBiblioteca } from '../roadmaps/biblioteca'

export interface Requerimiento {
  materia: string
  nivel?: Nivel | null
  unidad?: string
  pendiente?: boolean
}

const useLibreta = () => {
  // Datasource
  const { libreta, setLibreta } = useContext(LibretaContext)

  const { getMateria, getUnidad } = useBiblioteca()

  /**
   * Recibe un id de materia y devuelve la "hoja" de esa materia
   */
  const hojaDe = (idMateria: string) => {
    const materia = getMateria(idMateria)
    if (!materia) return null

    /**
     * Activa o desactiva todas las unidades listadas bajo un nivel en el meta de la materia
     */
    const toggleNivel = (nivel: Nivel) => {
      // Accedemos a los niveles de esa materia
      const niveles = materia.meta.niveles
      if (!niveles || !niveles[nivel]) return null

      // Creamos un objecto cuyas claves sean materia.unidad para cada unidad de ese nivel
      // y sus valores lo opuesto del actual valor de `nivelCompletado`
      const estadoNivel = nivelCompletado(nivel)

      const unidadesUpdateadas = fromEntries(niveles[nivel].map((unid) => [`${idMateria}.${unid}`, !estadoNivel]))
      setLibreta({ ...libreta, ...unidadesUpdateadas })
    }

    /**
     * Activa o desactiva una unidad en la libreta, por id
     */
    const toggleUnidad = (idUnidad: string) => {
      const unidad = getUnidad(idUnidad)
      if (!unidad) throw new Error(`Se solicitó la unidad ${idUnidad}, pero no está en la biblioteca`)

      // Si la unidad aún no está en la libreta, la creamos en true
      const clave = `${idMateria}.${idUnidad}`
      if (libreta[clave] === undefined) return setLibreta({ ...libreta, [clave]: true })
      setLibreta({ ...libreta, [clave]: !libreta[clave] })
    }

    /**
     * Averigua si todas las unidades de un nivel dado están marcadas
     */
    const nivelCompletado = (nivel: Nivel) => {
      const niveles = materia.meta.niveles
      if (!niveles || !niveles[nivel]) return null

      return niveles[nivel].reduce((acc, unid) => acc && libreta[`${idMateria}.${unid}`], true)
    }

    /**
     * Averigua si al menos una unidad del nivel dado está marcada
     */
    const nivelParcial = (nivel: Nivel) => {
      const niveles = materia.meta.niveles
      if (!niveles || !niveles[nivel]) return null

      return niveles[nivel].some((unid) => libreta[`${idMateria}.${unid}`])
    }

    /**
     * Devuelve las unidades propias de un cierto nivel
     */
    const unidadesDeNivel = (nivel: Nivel) => {
      const niveles = materia.meta.niveles
      const unidades = materia.meta.unidades
      if (!unidades || !niveles || !niveles[nivel]) return null

      return fromEntries(niveles[nivel].map((u) => [u, unidades[u]]))
    }

    /**
     * Devuelve el nivel de una unidad
     */
    const nivelDeUnidad = (unidad: string) => {
      const niveles = materia.meta.niveles
      const unidades = materia.meta.unidades
      if (!unidades || !niveles) return null

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [nv, unids] = find(entries(niveles), ([nv, unids]) => unids.includes(unidad)) ?? [null, null]
      return nv
    }

    /**
     * Devuelve los requerimientos de una unidad según las entradas del `requiere` del meta de la materia
     */
    const requerimientosDeUnidad = (idUnidad: string): Requerimiento[] | null => {
      const niveles = materia.meta.niveles
      const unidades = materia.meta.unidades
      const requiere = materia.meta.requiere

      if (!unidades || !niveles || !requiere) return null

      if (!Object.keys(unidades).includes(idUnidad)) {
        console.warn(
          `Se solicitaron los requerimientos de unidad ${idUnidad} de ${idMateria}, pero no se encuentra listada`
        )
        return []
      }
      if (!requiere) {
        return []
      }

      // Lógica para determinar los requerimientos
      const reqs = []

      // Primero nos enteramos de qué nivel es la unidad que estamos tratando (podría no ser de ninguno también - null)
      const nivelUnidad = nivelDeUnidad(idUnidad)

      // Requerimientos de materia: Una materia depende enteramente de otra
      // Si una materia A tiene listada a otra B como dependencia, significa que cada nivel de A tiene como requerimiento
      // el nivel correspondiente de B, es decir, que cada unidad de ese nivel en A tendrá como requerimiento todas las unidades
      // del mismo nivel en B
      const requerimientosMateria = requiere.filter((r) => isString(r))
      if (requerimientosMateria)
        if (!nivelDeUnidad) {
          console.warn(
            `${idMateria} requiere ${requerimientosMateria.join(', ')} pero su unidad ${idUnidad} no tiene nivel`
          )
          return []
        } else {
          for (const materia of requerimientosMateria) {
            // if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)
            reqs.push({ materia, nivel: nivelUnidad })
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

          // if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)

          if (nivelEnum.parse(nivelOUnidad)) {
            reqs.push({ materia, nivel: nivelOUnidad as Nivel })
          } else {
            reqs.push({ materia, unidad: nivelOUnidad })
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
          const [idMateriaDep, nivelOUnidad] = dependencia.split('.')

          // if (!esMateria(materia)) throw new Error(`${materia} no es una materia válida`)

          if (nivelEnum.parse(nivelOUnidad)) {
            reqs.push({ materia: idMateriaDep, nivel: nivelOUnidad as Nivel })
          } else {
            reqs.push({ materia: idMateriaDep, unidad: nivelOUnidad })
          }
        }

      return reqs
    }

    /**
     * Extiende la info de los requerimientos de unidad con el campo `pendiente`, booleando dependiendo de  si está o no en la libreta.
     */
    const requerimientosPendientesDeUnidad = (unidad: string) => {
      const reqs = requerimientosDeUnidad(unidad)
      if (!reqs) return

      return reqs.map((req) => ({
        ...req,
        pendiente: req.nivel
          ? !hojaDe(req.materia)?.nivelCompletado(req.nivel)
          : libreta[`${req.materia}.${req.unidad}`] ?? true,
      }))
    }

    /** Recibe un id de unidad y devuelve su status (boolean) */
    const statusDeUnidad = (idUnidad: string) => libreta[`${idMateria}.${idUnidad}`]

    return {
      toggleNivel,
      toggleUnidad,
      nivelCompletado,
      nivelParcial,
      unidadesDeNivel,
      nivelDeUnidad,
      statusDeUnidad,
      requerimientosDeUnidad,
      requerimientosPendientesDeUnidad,
    }
  }

  /** Recibe una key y devuelve el estado de esa key en la libreta */
  const statusDe = (id: string) => libreta[id]

  return { hojaDe, statusDe, libreta }
}

export default useLibreta
