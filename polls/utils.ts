import { z } from "zod";

export function extractZodErrorMessages(error: z.ZodError): string {
  return error.issues.map(err => `${err.path.join('.')} - ${err.message}`).join(', ');
}