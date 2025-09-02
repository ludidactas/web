import { Socket } from "socket.io";
import { z } from "zod";

export function extractZodErrorMessages(error: z.ZodError): string {
  return error.issues.map(err => err.message).join(', ');
}

export function sendError(socket: Socket, message: string) {
  socket.emit('poll:error', { message });
  // socket.disconnect(true);
}