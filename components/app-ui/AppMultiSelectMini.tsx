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

type Option = { value: string; label: string };

const AppMultiSelectMini = ({
  value,
  onChange,
  options,
  placeholder = 'Επιλέξτε...',
  className,
}: {
  value: string[]; // τρέχουσες επιλογές
  onChange: (v: string[]) => void; // ενημέρωση προς τα έξω
  options: Option[];
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = new Set(value);

  const toggle = (v: string) => {
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
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
                  .map((v) => options.find((o) => o.value === v)?.label || v)
                  .map((label) => (
                    <Badge key={label} variant='secondary'>
                      {label}
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
                const checked = selected.has(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    onSelect={() => toggle(o.value)}
                    className='flex items-center gap-2'
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(o.value)}
                    />
                    <span className='flex-1'>{o.label}</span>
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
