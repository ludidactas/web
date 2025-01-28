/* eslint-disable @typescript-eslint/no-unused-vars */
import useLibreta, { Requerimiento } from '@/components/hooks/libreta'
import { Checkbox } from '@/components/ui/checkbox'
import Radar from '@/components/ui/radar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { MetaMateria, Nivel } from '@/md/schema'
import { usePrevious } from '@uidotdev/usehooks'

import { CircleDashed, CircleDot } from 'lucide-react'
import { useEffect, useState } from 'react'
import { capitalize, entries } from 'remeda'
import { twMerge } from 'tailwind-merge'
import { useBiblioteca } from '../context/contenido'
import Image from 'next/image'

/** Display de los metadatos de una materia */
export default function LdMateria({ idMateria }: { idMateria?: string }) {
  const [meta, setMeta] = useState<MetaMateria>()
  const lastMeta = usePrevious(meta)

  const { getMateria } = useBiblioteca()
  const { libreta } = useLibreta()

  // Cuando cambie el artículo, updateamos el meta
  useEffect(() => {
    if (!idMateria) return setMeta(undefined)
    // Si está en el array de materias ya pasó por la verificación de zod
    const md = getMateria(idMateria)
    setMeta(md?.meta)
  }, [idMateria])

  return (
    <>
      {meta && (
        <>
          <h2 className="text-2xl">{meta.titulo}</h2>
          <div className="flex flex-col lg:flex-row">
            <p className="lg:max-w-96">
              <b>Descripción:</b> {meta.descripcion}
            </p>
            {meta.avatar && <Image width={224} height={224} src={meta.avatar} alt="Avatar" />}
            {idMateria && meta.stats && (
              <div className="lg:min-w-96">
                <Radar stats={meta.stats} />
              </div>
            )}
          </div>
          <h3 className="text-xl">Dependencias:</h3>
          <p>Checkeá teniendo en cuenta las observaciones</p>
          {idMateria && meta.niveles && (
            <div className="max-h-96 overflow-scroll">
              <p className="px-8">Marcá los checks a continuación teniendo en cuenta las observaciones:</p>
              {entries(meta.niveles).map(([nivel, unidades]) => (
                <CheckNivel idMateria={idMateria} nivel={nivel} key={nivel} />
              ))}
            </div>
          )}
        </>
      )}
      {!meta && idMateria && <p>[{idMateria}] aún no está en la biblioteca</p>}
      {!meta && !idMateria && <p>Clickeá una materia para comenzar</p>}
      <pre>{JSON.stringify(libreta, null, 2)}</pre>
    </>
  )
}

interface CheckNivelProps {
  nivel: Nivel
  idMateria: string
}

const CheckNivel = ({ idMateria, nivel }: CheckNivelProps) => {
  const { hojaDe } = useLibreta()
  const hoja = hojaDe(idMateria)
  const idsUnidades = hoja?.unidadesDeNivel(nivel)

  if (!hoja) return <p>No tenemos hoja de {idMateria} en la biblioteca</p>

  if (!idsUnidades)
    return (
      <p>
        No hay unidades de {idMateria}.{nivel}
      </p>
    )

  return (
    <div>
      {/* Checkbox principal de nivel */}
      <div className="px-8 py-2 flex gap-2 items-center">
        <Checkbox
          id={nivel}
          checked={hoja?.nivelCompletado(nivel) ? true : hoja?.nivelParcial(nivel) ? 'indeterminate' : false}
          onClick={() => hoja?.toggleNivel(nivel)}
        />
        <label
          htmlFor={nivel}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {capitalize(nivel)}
        </label>
      </div>

      {/* Subchecks por unidad */}
      <div className="flex flex-col pl-8">
        {idsUnidades &&
          entries(idsUnidades).map(([idUnidad, texto]) => (
            <CheckConTooltip idMateria={idMateria} idUnidad={idUnidad} texto={texto} key={`${idMateria}.${idUnidad}`} />
          ))}
      </div>
    </div>
  )
}

/**
 * Si la unidad tiene dependencias, le renderiza un tooltip
 */
const CheckConTooltip = ({ idMateria, idUnidad, texto }: { idMateria: string; idUnidad: string; texto: string }) => {
  const { hojaDe } = useLibreta()
  const hoja = hojaDe(idMateria)
  const dependencias = hoja?.requerimientosPendientesDeUnidad(idUnidad)

  if (!dependencias || dependencias.length === 0) {
    return <CheckUnidad idMateria={idMateria} idUnidad={idUnidad} texto={texto} />
  }

  const renderRequerimiento = (dep: Requerimiento) => {
    if (dep.nivel) return `Nivel ${dep.nivel} de ${dep.materia}`
    if (dep.unidad) return `Unidad ${dep.unidad} de ${dep.materia}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <CheckUnidad idMateria={idMateria} idUnidad={idUnidad} texto={texto} requerimientos={dependencias} />
            {JSON.stringify(dependencias)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="w-max">
            <p>Esta unidad tiene como dependencia{dependencias.length > 1 ? 's' : ''}: </p>
            {dependencias.map((dep) => (
              <p className="flex items-center gap-2" key={`${dep.materia}.${dep.nivel ?? dep.unidad}`}>
                {dep.pendiente ? <CircleDashed className="inline-block" /> : <CircleDot className="inline-block" />}
                {renderRequerimiento(dep)}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const CheckUnidad = ({
  idMateria,
  idUnidad,
  texto,
  requerimientos,
}: {
  idMateria: string
  idUnidad: string
  texto: string
  requerimientos?: Requerimiento[] | null
}) => {
  const hoja = useLibreta().hojaDe(idMateria)
  const requerimientosPendientes = requerimientos?.some((r) => r.pendiente)

  return (
    <div className="px-8 py-2 flex gap-2 items-center" key={idUnidad}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={idUnidad}
          className="w-2 h-2"
          checked={hoja?.statusDeUnidad(idUnidad)}
          onClick={() => hoja?.toggleUnidad(idUnidad)}
          disabled={requerimientosPendientes}
        />
        <label
          htmlFor={idUnidad}
          className={twMerge(
            'text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            requerimientosPendientes && 'text-muted-foreground italic cursor-not-allowed'
          )}
        >
          {capitalize(idUnidad)} : {texto}
        </label>
      </div>
    </div>
  )
}
