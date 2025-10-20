import { z } from 'zod';

export const organizationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),

    // '' -> undefined, uppercase όταν υπάρχει
    code: z.string().optional(),

    type: z.enum([
      'MILITARY',
      'GOVERNMENT',
      'NGO',
      'ALLIANCE',
      'ECONOMIC_BLOC',
      'MINISTRY',
      'INTELLIGENCE',
      'DEFENSE_MINISTRY',
      'OTHER',
    ]),

    // ''/null -> undefined, κρατάμε σκέτο string optional (βάλε url() αν θέλεις)
    organizationImage: z.string().optional(),

    // ''/null -> undefined, max 4000
    description: z
      .string()
      .max(4000, 'Μέγιστο μήκος περιγραφής 4000 χαρακτήρες.')
      .optional(),
    // '' -> undefined, cuid όταν υπάρχει
    //countryId: z.string().optional(),

    countriesIds: z.array(z.string()).optional().default([]),
    parentId: z.string().optional(),
  })
  .refine(
    // προστασία self-parent αν ποτέ περάσεις και id μέσα στο input
    (data) =>
      !(
        'id' in data &&
        (data as any).id &&
        data.parentId &&
        (data as any).id === data.parentId
      ),
    {
      message: 'Ένας οργανισμός δεν μπορεί να έχει parent τον εαυτό του.',
      path: ['parentId'],
    }
  );
export type OrganizationInput = z.infer<typeof organizationSchema>;
