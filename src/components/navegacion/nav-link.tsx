'use client'

import Link from 'next/link'
import { ComponentProps, ReactNode } from 'react'
import LoadingSala from '@/components/salas/loading-sala'
import { useNavegacionConCarga } from './use-navegacion-con-carga'

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'onClick' | 'children'> & {
  /** Activa el overlay de pantalla completa mientras navega con el mensaje provisto; empalma con el loading.tsx de destino. */
  overlayMensaje?: string
  /** Función: render prop con isPending, para feedback inline (spinner) sin duplicar el contenido común. */
  children: ReactNode | ((isPending: boolean) => ReactNode)
}

/**
 * Link que sabe de su loading state. Se le puede pasar una función como children.
 * Ver Patrón Function as child component https://reactpatterns.js.org/docs/function-as-child-component/
 * (los dos primeros snippets alcanza)
 */
export function NavLink({ href, overlayMensaje, children, ...rest }: NavLinkProps) {
  const { isPending, onClickNavegar } = useNavegacionConCarga()
  const destino = href.toString()

  return (
    <>
      {/* Render condicional condicional */}
      <Link href={href} onClick={onClickNavegar(destino)} {...rest}>
        {typeof children === 'function' ? children(isPending) : children}
      </Link>
      {/* Overlay */}
      {isPending && overlayMensaje && <LoadingSala overlay mensaje={overlayMensaje} />}
    </>
  )
}
