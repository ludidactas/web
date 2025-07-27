import z from "zod";

export const pollBase = z.object({
  pregunta: z.string().min(1, "La pregunta es obligatoria"),
  opciones: z.array(z.string().min(1, "Cada opción debe tener al menos un carácter")).min(2, "Debe haber al menos dos opciones"),
})

export const pollCreator = pollBase.extend({
  password: z.string().min(1, "La contraseña maestra es obligatoria"),
});

export const voteValidator = z.object({
  pollId: z.string().min(1, "El ID de la encuesta es obligatorio"),
  optionId: z.string().min(1, "El ID de la opción es obligatorio"),
});