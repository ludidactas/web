import { importarBiblioteca } from '@/components/roadmap/importMdx'
import { BibliotecaProvider } from '@/components/roadmaps/biblioteca'

// Server component. Carga los MDs y los inyecta en el MDXProvider

export async function BibliotecaRoot({ children }: { children: React.ReactNode }) {
  // Cargamos MDs
  const modules = await importarBiblioteca()

  // Se los pasamos al provider
  return <BibliotecaProvider biblioteca={modules}>{children}</BibliotecaProvider>
}
