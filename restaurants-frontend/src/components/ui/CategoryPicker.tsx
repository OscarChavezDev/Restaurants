'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { cn } from '@/utils/cn';

export function CategoryPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => restaurantService.getCategories(),
    staleTime: 1000 * 60 * 30,
  });

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  if (isLoading) {
    return <div className="flex flex-wrap gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 w-24 rounded-full skeleton" />)}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2.5 p-2">
      {(categories ?? []).map((c) => {
        const active = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200',
              active
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-105'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            )}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
