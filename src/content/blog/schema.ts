import { z } from 'zod'

export const postMetaSchema = z.object({
  titulo: z.string(),
  fecha: z.coerce.date(),
  resumen: z.string(),
  imagen: z.string().optional(),
  twImagen: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type PostMeta = z.infer<typeof postMetaSchema>
