import { z } from 'zod';

export const userReservationsParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
