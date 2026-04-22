'use client';

import * as React from 'react';
import {
  Area, AreaChart, Bar, BarChart, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatUZS } from '@/lib/utils';
import { useTranslation } from '@/contexts/i18n-context';

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #DADCE0',
  borderRadius: 10,
  color: '#202124',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const INCOME  = '#137333';
const EXPENSE = '#C5221F';
const INCOME_FILL  = 'url(#incomeFill)';
const EXPENSE_FILL = 'url(#expenseFill)';

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

interface IncomeExpensePoint { date: string; income: number; expense: number; }

export function IncomeExpenseAreaChart({ data }: { data: IncomeExpensePoint[] }) {
  const { t } = useTranslation();
  const cur = t('common.currency');
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={INCOME}  stopOpacity={0.2} />
            <stop offset="100%" stopColor={INCOME}  stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={EXPENSE} stopOpacity={0.2} />
            <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 11, fill: '#80868B' }}
        />
        <YAxis
          tickFormatter={fmtAxis}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 11, fill: '#80868B' }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [
            `${formatUZS(v)} ${cur}`,
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          iconType="circle" iconSize={8}
        />
        <Area
          type="monotone" dataKey="income"
          name={t('charts.income')}
          stroke={INCOME} fill={INCOME_FILL} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone" dataKey="expense"
          name={t('charts.expense')}
          stroke={EXPENSE} fill={EXPENSE_FILL} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DonutDatum { name: string; value: number; color: string; }

export function CategoryDonut({ data }: { data: DonutDatum[] }) {
  const { t } = useTranslation();
  const cur = t('common.currency');
  if (data.length === 0) {
    return (
      <div className="h-[240px] grid place-items-center text-[13px] text-muted">
        {t('common.noData')}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data} dataKey="value" nameKey="name"
          innerRadius={58} outerRadius={90}
          paddingAngle={2} stroke="#FFFFFF" strokeWidth={2}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => `${formatUZS(v)} ${cur}`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle" iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarDatum { name: string; value: number; color: string; }

export function HorizontalBars({ data }: { data: BarDatum[] }) {
  const { t } = useTranslation();
  const cur = t('common.currency');
  if (data.length === 0) {
    return (
      <div className="h-[220px] grid place-items-center text-[13px] text-muted">
        {t('common.noData')}
      </div>
    );
  }
  const height = Math.max(220, data.length * 42 + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data} layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8EAED" />
        <XAxis
          type="number" tickFormatter={fmtAxis}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 11, fill: '#80868B' }}
        />
        <YAxis
          type="category" dataKey="name" width={115}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 12, fill: '#5F6368' }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => `${formatUZS(v)} ${cur}`}
          cursor={{ fill: '#F1F3F4' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data }: { data: IncomeExpensePoint[] }) {
  const { t } = useTranslation();
  const cur = t('common.currency');
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 11, fill: '#80868B' }}
        />
        <YAxis
          tickFormatter={fmtAxis}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 11, fill: '#80868B' }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [
            `${formatUZS(v)} ${cur}`, name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          iconType="circle" iconSize={8}
        />
        <Line
          type="monotone" dataKey="income"
          name={t('charts.income')}
          stroke={INCOME} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone" dataKey="expense"
          name={t('charts.expense')}
          stroke={EXPENSE} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
