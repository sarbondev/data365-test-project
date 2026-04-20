import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  subtitle,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12',
        className,
      )}
    >
      <div className="h-12 w-12 rounded-full bg-surfaceAlt grid place-items-center text-muted mb-4">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
      {subtitle && (
        <p className="mt-1.5 text-[13px] text-muted max-w-sm">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
