import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:  'bg-primary text-surface hover:bg-sky-400 glow-primary',
        ghost:    'bg-transparent border border-white/10 text-textPrimary hover:bg-white/5',
        danger:   'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
        success:  'bg-success/10 border border-success/30 text-success hover:bg-success/20',
      },
      size: {
        sm:  'px-3 py-1.5 text-sm',
        md:  'px-5 py-2.5 text-sm',
        lg:  'px-7 py-3.5 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = 'Button';
