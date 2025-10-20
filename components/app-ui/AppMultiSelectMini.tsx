// components/app-ui/AppMultiSelectMini.tsx
'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type MultiOption = {
  id?: string; // <- προαιρετικό
  value?: string; // <- προαιρετικό
  label: string;
  name?: string;
  // μπορείς να κρατήσεις extra fields αν θες:
  [k: string]: unknown;
};

const getOptValue = (o: MultiOption) => String(o.value ?? o.id ?? '');
const getOptLabel = (o: MultiOption) => String((o.label || o.name) ?? '');

const AppMultiSelectMini = ({
  value,
  onChange,
  options,
  placeholder = 'Επιλέξτε...',
  className,
}: {
  value: string[]; // selected ids/values (normalized)
  onChange: (v: string[]) => void;
  options: MultiOption[]; // <- δέχεται και id και value
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = new Set(value);
  console.log('options', options);
  const toggle = (raw: string) => {
    const next = new Set(selected);
    next.has(raw) ? next.delete(raw) : next.add(raw);
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            className='w-full justify-between'
          >
            <div className='flex gap-2 flex-wrap'>
              {value.length === 0 ? (
                <span className='text-muted-foreground'>{placeholder}</span>
              ) : (
                value
                  .map((v) => options.find((o) => getOptValue(o) === v))
                  .filter(Boolean)
                  .map((o) => (
                    <Badge key={getOptValue(o!)} variant='secondary'>
                      {getOptLabel(o!)}
                    </Badge>
                  ))
              )}
            </div>
            <ChevronDown className='h-4 w-4 opacity-60' />
          </Button>
        </PopoverTrigger>

        <PopoverContent className='p-0 w-[var(--radix-popover-trigger-width)]'>
          <Command>
            <CommandInput placeholder='Αναζήτηση...' />
            <CommandEmpty>Δεν βρέθηκαν αποτελέσματα</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const val = getOptValue(o);
                const label = getOptLabel(o);
                const checked = selected.has(val);
                return (
                  <CommandItem
                    key={val}
                    onSelect={() => toggle(val)}
                    className='flex items-center gap-2'
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(val)}
                    />
                    <span className='flex-1'>{label}</span>
                    {checked ? <Check className='h-4 w-4' /> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>

          {value.length > 0 && (
            <div className='border-t p-2'>
              <Button size='sm' variant='ghost' onClick={clearAll}>
                Καθαρισμός
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AppMultiSelectMini;
