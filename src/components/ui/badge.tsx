import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from 'src/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
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
        hold: 'border-transparent bg-red-500 text-red-50 hover:bg-red-500/80',
        todo: 'border-transparent bg-slate-500 text-slate-50 hover:bg-slate-500/80',
        'in-progress':
          'border-transparent bg-blue-500 text-blue-50 hover:bg-blue-500/80',
        completed:
          'border-transparent bg-green-500 text-green-50 hover:bg-green-500/80',
        paused:
          'border-transparent bg-amber-500 text-amber-50 hover:bg-amber-500/80',
        scrapped:
          'border-transparent bg-red-500 text-red-50 hover:bg-red-500/80',
        manufacturing:
          'border-transparent bg-indigo-500 text-indigo-50 hover:bg-indigo-500/80',
        'quality-control':
          'border-transparent bg-cyan-500 text-cyan-50 hover:bg-cyan-500/80',
        ship: 'border-transparent bg-emerald-500 text-emerald-50 hover:bg-emerald-500/80'
      },
      color: {
        slate: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        gray: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        zinc: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
        neutral: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        stone: 'bg-stone-100 text-stone-900 hover:bg-stone-200',
        red: 'bg-red-100 text-red-900 hover:bg-red-200',
        orange: 'bg-orange-100 text-orange-900 hover:bg-orange-200',
        amber: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
        yellow: 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200',
        lime: 'bg-lime-100 text-lime-900 hover:bg-lime-200',
        green: 'bg-green-100 text-green-900 hover:bg-green-200',
        emerald: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
        teal: 'bg-teal-100 text-teal-900 hover:bg-teal-200',
        cyan: 'bg-cyan-100 text-cyan-900 hover:bg-cyan-200',
        sky: 'bg-sky-100 text-sky-900 hover:bg-sky-200',
        blue: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
        indigo: 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200',
        violet: 'bg-violet-100 text-violet-900 hover:bg-violet-200',
        purple: 'bg-purple-100 text-purple-900 hover:bg-purple-200',
        fuchsia: 'bg-fuchsia-100 text-fuchsia-900 hover:bg-fuchsia-200',
        pink: 'bg-pink-100 text-pink-900 hover:bg-pink-200',
        rose: 'bg-rose-100 text-rose-900 hover:bg-rose-200'
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
