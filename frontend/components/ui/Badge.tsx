import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-white/10 text-white/70',
  success:  'bg-success/20 text-success',
  warning:  'bg-warning/20 text-warning',
  danger:   'bg-danger/20 text-danger',
  info:     'bg-primary/20 text-primary',
};

export function Badge({ variant = 'default', children, className }: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
