import { z } from 'zod';

const DAY_IN_MS = 86_400_000;

export const amenityReservationsParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const amenityReservationsQuerySchema = z.object({
  date: z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return Number.NaN;
      }

      return Number(value);
    },
    z
      .number()
      .int()
      .positive()
      .refine(
        (parsedDate) => parsedDate % DAY_IN_MS === 0,
        'date must be a day-start timestamp in milliseconds',
      ),
  ),
});
