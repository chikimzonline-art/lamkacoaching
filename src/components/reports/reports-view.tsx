'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Banknote, FileText, TrendingUp, Users, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

type Period = 'daily' | 'weekly' | 'monthly';

interface ReportData {
  labels: string[];
  revenue: number[];
  totalRevenue: number;
  paymentCount: number;
  topStudents: { name: string; totalPaid: number }[];
}

interface ChartDataPoint {
  label: string;
  revenue: number;
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-cyan-700">{formatCurrency(payload[0].value * 100)}</p>
    </div>
  );
}

export default function ReportsView() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      const json = await res.json();
      if (json.labels) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;

    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    const rows: string[][] = [
      [`Lamka Coaching Center - Revenue Report (${periodLabel})`],
      [`Generated on, ${new Date().toLocaleString('en-IN')}`],
      [],
      [`Period, Revenue (₹)`],
      ...data.labels.map((label, i) => [label, data.revenue[i].toLocaleString('en-IN', { minimumFractionDigits: 2 })]),
      [],
      [`Total Revenue, ₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      [`Total Payments, ${data.paymentCount}`],
      [`Average per Payment, ₹${data.paymentCount > 0 ? (data.totalRevenue / data.paymentCount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`],
      [],
      [`Top Students`],
      [`Name, Total Paid (₹)`],
      ...data.topStudents.map((s) => [s.name, s.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lamka-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, period]);

  const chartData: ChartDataPoint[] = data
    ? data.labels.map((label, i) => ({ label, revenue: data.revenue[i] }))
    : [];

  const avgPerPayment = data && data.paymentCount > 0 ? data.totalRevenue / data.paymentCount : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center text-gray-500">
          <p>Failed to load reports data. Please try refreshing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === p
                  ? 'bg-white text-cyan-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue * 100)}
          icon={<Banknote className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
        />
        <StatCard
          title="Total Payments"
          value={String(data.paymentCount)}
          icon={<FileText className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
        />
        <StatCard
          title="Avg per Payment"
          value={formatCurrency(avgPerPayment * 100)}
          icon={<TrendingUp className="h-5 w-5 text-cyan-600" />}
          color="bg-cyan-50"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              Revenue Overview
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[320px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    tickFormatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                  <Bar
                    dataKey="revenue"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Students Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-600" />
              Top Students by Revenue
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Top {data.topStudents.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.topStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No payment data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 pr-4">
                      Rank
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 pr-4">
                      Student
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                      Total Paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topStudents.map((student, index) => (
                    <tr
                      key={student.name}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-sky-100 text-sky-700'
                              : index === 1
                                ? 'bg-gray-100 text-gray-600'
                                : index === 2
                                  ? 'bg-cyan-100 text-cyan-700'
                                  : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-semibold text-cyan-700">
                          {formatCurrency(student.totalPaid * 100)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
