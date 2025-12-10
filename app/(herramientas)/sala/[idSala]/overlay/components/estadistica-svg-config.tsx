import { z } from 'zod'

// Validación de query params
export const estadisticaSvgConfigValidator = z.object({
  bg: z.string().optional().default('rgba(0, 0, 0, 0.4)'),
  barHeight: z.number().optional().default(40),
  barSpacing: z.number().optional().default(60),
  titleHeight: z.number().optional().default(40),
  margin:z.number().optional().default(80)
})

export type EstadisticaSvgConfig = z.infer<typeof estadisticaSvgConfigValidator>
