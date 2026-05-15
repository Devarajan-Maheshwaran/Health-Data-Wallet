import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-primary-500/20 text-primary-500 border border-primary-500/30',
        success:  'bg-success/20 text-success border border-success/30',
        warning:  'bg-warning/20 text-warning border border-warning/30',
        danger:   'bg-danger/20 text-danger border border-danger/30',
        outline:  'border border-white/20 text-white/70',
        ghost:    'bg-white/5 text-white/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
