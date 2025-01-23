import { importarBiblioteca } from '@/lib/importMdx'
import { BibliotecaProvider } from '@/components/context/contenido'

// Server component. Carga los MDs y los inyecta en el MDXProvider

export async function BibliotecaRoot({ children }: { children: React.ReactNode }) {
  // Cargamos MDs
  const modules = await importarBiblioteca()

  // Se los pasamos al provider
  return <BibliotecaProvider biblioteca={modules}>{children}</BibliotecaProvider>
}
