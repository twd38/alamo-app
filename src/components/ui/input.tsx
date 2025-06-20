import * as React from 'react';

import { cn } from 'src/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * The size variant of the input
   * @default "sm"
   */
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = 'sm', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          inputSize === 'sm' && 'h-8 px-2 py-1 text-sm file:text-sm',
          inputSize === 'md' && 'h-10 px-3 py-2 text-sm file:text-sm',
          inputSize === 'lg' && 'h-12 px-4 py-3 text-base file:text-base',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
