import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="h-8 w-8 text-accent" />
    </div>
  );
}
