import { z } from 'zod';

export const regionSchema = z.object({
  name: z.string().min(1, 'Απαιτείται όνομα'),
  code: z
    .string()
    .trim()
    .max(50, 'Μέχρι 50 χαρακτήρες')
    .optional()
    .or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
});
