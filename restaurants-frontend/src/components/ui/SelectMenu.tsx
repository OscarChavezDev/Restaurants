'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option { value: string; label: string }

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const internalValue = value === '' ? '__empty__' : value;
  const handleInternalChange = (val: string) => onChange(val === '__empty__' ? '' : val);

  return (
    <SelectPrimitive.Root value={internalValue} onValueChange={handleInternalChange}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-2 border border-gray-200 dark:border-gray-800/60 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-gray-400 opacity-70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-[999] relative max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-gray-100 dark:border-[#352D25] bg-white dark:bg-[#15120E] text-gray-700 dark:text-gray-300 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport className="p-1.5 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
            {options.map((o) => {
              const itemValue = o.value === '' ? '__empty__' : o.value;
              return (
              <SelectPrimitive.Item
                key={itemValue}
                value={itemValue}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-3.5 pr-8 text-sm outline-none transition-colors focus:bg-orange-50 dark:focus:bg-orange-500/10 focus:text-orange-700 dark:focus:text-orange-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  value === o.value && 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-semibold'
                )}
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-orange-500" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            )})}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
