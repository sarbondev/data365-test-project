import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from './ui/card';
import { formatPercent, formatUZS } from '@/lib/utils';

interface StatCardProps {
  label: string;
  amount: number;
  change: number;
  tone?: 'success' | 'danger' | 'neutral';
  invertChange?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  amount,
  change,
  tone = 'neutral',
  invertChange,
  icon,
}: StatCardProps) {
  const positive = invertChange ? change < 0 : change > 0;
  const negative = invertChange ? change > 0 : change < 0;
  const ChangeIcon =
    change === 0 ? Minus : positive ? ArrowUp : ArrowDown;

  const amountColor =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-danger'
        : 'text-foreground';

  const changeColor = positive
    ? 'text-success'
    : negative
      ? 'text-danger'
      : 'text-muted';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-[12px] text-muted font-medium">{label}</p>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
      <p className={`mt-3 text-[26px] font-medium tabular ${amountColor}`}>
        {formatUZS(amount)}
        <span className="text-[13px] font-normal text-muted ml-1.5">so'm</span>
      </p>
      <div
        className={`mt-2 inline-flex items-center gap-1 text-[12px] ${changeColor}`}
      >
        <ChangeIcon className="h-3 w-3" />
        <span className="tabular">{formatPercent(change)}</span>
        <span className="text-muted ml-1">vs oldingi davr</span>
      </div>
    </Card>
  );
}
