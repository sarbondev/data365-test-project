'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatUZS } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E0E0E0',
  borderRadius: 4,
  color: '#212121',
  fontSize: 12,
  padding: '6px 10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const INCOME = '#2E7D32';
const EXPENSE = '#C62828';

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

interface IncomeExpensePoint {
  date: string;
  income: number;
  expense: number;
}

export function IncomeExpenseAreaChart({
  data,
}: {
  data: IncomeExpensePoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INCOME} stopOpacity={0.25} />
            <stop offset="100%" stopColor={INCOME} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={fmtAxis} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => formatUZS(v) + " so'm"}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="income"
          name="Kirim"
          stroke={INCOME}
          fill="url(#incomeFill)"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Xarajat"
          stroke={EXPENSE}
          fill="url(#expenseFill)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function CategoryDonut({ data }: { data: DonutDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[240px] grid place-items-center text-[13px] text-muted">
        Ma'lumot yo'q
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={1}
          stroke="#FFFFFF"
          strokeWidth={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => formatUZS(v) + " so'm"}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(name) => <span className="text-muted">{name}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarDatum {
  name: string;
  value: number;
  color: string;
}

export function HorizontalBars({ data }: { data: BarDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[240px] grid place-items-center text-[13px] text-muted">
        Ma'lumot yo'q
      </div>
    );
  }
  const height = Math.max(220, data.length * 38 + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 6, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="2 4" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={fmtAxis}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => formatUZS(v) + " so'm"}
          cursor={{ fill: '#F5F5F5' }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data }: { data: IncomeExpensePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={fmtAxis} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => formatUZS(v) + " so'm"}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="income"
          name="Kirim"
          stroke={INCOME}
          strokeWidth={1.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Xarajat"
          stroke={EXPENSE}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
