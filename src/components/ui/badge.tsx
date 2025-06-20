import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from 'src/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:
          'border-border border-muted-foreground/40 text-muted-foreground',
        todo: 'border-transparent bg-slate-500 text-slate-50 hover:bg-slate-500/80',
        'in-progress':
          'border-transparent bg-blue-500 text-blue-50 hover:bg-blue-500/80',
        completed:
          'border-transparent bg-green-500 text-green-50 hover:bg-green-500/80',
        paused:
          'border-transparent bg-amber-500 text-amber-50 hover:bg-amber-500/80',
        scrapped:
          'border-transparent bg-red-500 text-red-50 hover:bg-red-500/80'
      },
      color: {
        slate: 'bg-slate-200 text-slate-900 hover:bg-slate-200/60',
        gray: 'bg-gray-200 text-gray-900 hover:bg-gray-200/60',
        zinc: 'bg-zinc-200 text-zinc-900 hover:bg-zinc-200/60',
        neutral: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-200/60',
        stone: 'bg-stone-200 text-stone-900 hover:bg-stone-200/60',
        red: 'bg-red-200 text-red-900 hover:bg-red-200/60',
        orange: 'bg-orange-200 text-orange-900 hover:bg-orange-200/60',
        amber: 'bg-amber-200 text-amber-900 hover:bg-amber-200/60',
        yellow: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-200/60',
        lime: 'bg-lime-200 text-lime-900 hover:bg-lime-200/60',
        green: 'bg-green-200 text-green-900 hover:bg-green-200/60',
        emerald: 'bg-emerald-200 text-emerald-900 hover:bg-emerald-200/80',
        teal: 'bg-teal-200 text-teal-900 hover:bg-teal-200/60',
        cyan: 'bg-cyan-200 text-cyan-900 hover:bg-cyan-200/60',
        sky: 'bg-sky-200 text-sky-900 hover:bg-sky-200/60',
        blue: 'bg-blue-200 text-blue-900 hover:bg-blue-200/60',
        indigo: 'bg-indigo-200 text-indigo-900 hover:bg-indigo-200/60',
        violet: 'bg-violet-200 text-violet-900 hover:bg-violet-200/60',
        purple: 'bg-purple-200 text-purple-900 hover:bg-purple-200/60',
        fuchsia: 'bg-fuchsia-200 text-fuchsia-900 hover:bg-fuchsia-200/60',
        pink: 'bg-pink-200 text-pink-900 hover:bg-pink-200/60',
        rose: 'bg-rose-200 text-rose-900 hover:bg-rose-200/60'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, color }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
