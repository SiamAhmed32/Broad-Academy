import { z } from "zod";

export const gameOutcomeSchema = z.enum(["win", "loss", "draw"]);

export const gameResultSchema = z.object({
  sessionId: z.string().min(1).max(64),
  outcome: gameOutcomeSchema,
  moves: z.coerce.number().int().min(5).max(9),
});
