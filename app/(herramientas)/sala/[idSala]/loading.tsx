import { cn } from '@/lib/utils' 

interface LoadingSalaProps {
  overlay?: boolean
}

export default function LoadingSalaEstudiante({ overlay = false }: LoadingSalaProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-r from-cyan-500/70 to-indigo-500/70',
        overlay
          ? 'fixed inset-0 z-50 h-screen w-screen' // Cubre header y todo lo demás
          : 'h-screen w-screen' // Default (en loading.tsx)
      )}
    >
      Cargando...
    </div>
  )
}
