import { useContext } from 'react'
import { fromEntries } from 'remeda'
import LibretaContext from '../context/libreta'
import { getArticulo } from '@/md'

export enum Nivel {
  Contacto = 'Entradx en contacto',
  Allegado = 'Allegado',
  Familiar = 'Familiar',
  Avanzado = 'Avanzado',
  Experto = 'Expertx',
}

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

  if (!unidades || !niveles) throw new Error(`Faltan o unidades o niveles de ${materia}`)

  /**
   * Activa o desactiva todas las unidades listadas bajo un nivel en el meta de la materia
   */
  const toggleNivel = (nivel: Nivel) => {
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

  return { libreta, unidades, niveles, toggleNivel, toggleUnidad, nivelCompletado, nivelParcial, unidadesDeNivel }
}

export default useLibreta

// Niveles de familiaridad:

// 1 - Contacto:
// - Tengo idea de qué va el tema, sus conceptos básicos y rudimentos operativos
// - Puedo más o menos leer estructuralmente contenidos, aunque pudiera no entender todo el vocabulario, y hasta podría realizar pequeñas modificaciones
// - Puede comprobarse con un assessment

// 2 - Allegado:
// - Si bien pueden escaparseme algunos términos, conozco el vocabulario básico que cubre el 80 % de lo que puede expresarse en este dominio, y puedo escribir mis contenidos a partir de consignas claras o contenidos base
// - Puede comprobarse con ejercicios

// 3 - Familiar:
// - En virtud de la práctica y ejercitación reiterada me entiendo con el tema de manera que puedo abrirme paso en escenarios imprevistos
// - Si no conozco algo sé dónde informarme sobre ello y domino la facultad de escribir
// - Puede comprobarse con un proyecto

// 4 - Avanzado:
// - Llevé a término proyectos y conozco las prácticas de la comunidad o la industria
// - Puede comprobarse con un proyecto avanzado, probablemente grupal

// 5 - Expertx:
// - Este dominio no me guarda secretos, y conozco sus puntos de contacto con dominios adyacentes
