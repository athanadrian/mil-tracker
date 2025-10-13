import z from 'zod';
import { regionSchema } from '@/validations/tools/region.validation';

export type RegionInput = z.infer<typeof regionSchema>;
export type RegionDTO = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
};
