import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getEntityName, type EntityKey } from '@/actions/common.actions';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// helper για AutoBreadcrumbs κτλ.
export const loaderFor = (entity: EntityKey) => async (id: string) =>
  getEntityName(entity, id);
