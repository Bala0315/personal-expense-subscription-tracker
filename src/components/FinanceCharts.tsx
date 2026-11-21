import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const CATEGORY_COLORS = [
  '#2563EB', // Royal Blue
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#EC4899', // Rose
  '#14B8A6', // Teal
  '#64748B', // Slate
];

interface CategoryPieChartProps {
  data: { category: string; total: number }[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chartRef.current?.destroy();

    const hasData = data.length > 0;
    chartRef.current = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: hasData ? data.map((d) => d.category) : ['No Expenses Yet'],
        datasets: [
          {
            data: hasData ? data.map((d) => d.total) : [1],
            backgroundColor: hasData ? CATEGORY_COLORS : ['#E2E8F0'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 12,
              color: '#334155',
              font: { family: '"DM Sans", sans-serif', size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                hasData
                  ? ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ' No records for this month',
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data]);

  return (
    <div className="relative h-[260px] w-full">
      <canvas ref={canvasRef} aria-label="Pie chart displaying expenses by category" />
    </div>
  );
};

interface MonthlyBarChartProps {
  data: { monthKey: string; total: number }[];
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.monthKey),
        datasets: [
          {
            label: 'Monthly Expenses (₹)',
            data: data.map((d) => d.total),
            backgroundColor: '#2563EB',
            hoverBackgroundColor: '#1D4ED8',
            borderRadius: 6,
            maxBarThickness: 44,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ₹${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: '"IBM Plex Mono", monospace', size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { family: '"IBM Plex Mono", monospace', size: 11 },
              callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data]);

  return (
    <div className="relative h-[260px] w-full">
      <canvas ref={canvasRef} aria-label="Bar chart displaying monthly expenses" />
    </div>
  );
};

interface BudgetDoughnutChartProps {
  budgetLimit: number;
  totalSpent: number;
}

export const BudgetDoughnutChart: React.FC<BudgetDoughnutChartProps> = ({
  budgetLimit,
  totalSpent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chartRef.current?.destroy();

    const isOver = budgetLimit > 0 && totalSpent > budgetLimit;
    const isWarn = budgetLimit > 0 && totalSpent / budgetLimit >= 0.8 && !isOver;
    const remaining = Math.max(0, budgetLimit - totalSpent);

    const labels =
      budgetLimit <= 0
        ? ['No Budget Set']
        : isOver
          ? ['Budget Limit', 'Exceeded By']
          : ['Spent', 'Remaining'];

    const values =
      budgetLimit <= 0
        ? [1]
        : isOver
          ? [budgetLimit, Number((totalSpent - budgetLimit).toFixed(2))]
          : [Number(totalSpent.toFixed(2)), Number(remaining.toFixed(2))];

    const colors =
      budgetLimit <= 0
        ? ['#E2E8F0']
        : isOver
          ? ['#F59E0B', '#DC2626']
          : isWarn
            ? ['#D97706', '#E2E8F0']
            : ['#2563EB', '#E2E8F0'];

    chartRef.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              color: '#334155',
              font: { family: '"DM Sans", sans-serif', size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                budgetLimit <= 0
                  ? ' Set a budget limit to track usage'
                  : ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [budgetLimit, totalSpent]);

  return (
    <div className="relative h-[240px] w-full">
      <canvas ref={canvasRef} aria-label="Doughnut chart displaying monthly budget usage" />
    </div>
  );
};

interface SpendingLineChartProps {
  data: { date: string; total: number }[];
}

export const SpendingLineChart: React.FC<SpendingLineChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => d.date.slice(5)),
        datasets: [
          {
            label: 'Daily Spending (₹)',
            data: data.map((d) => d.total),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            tension: 0.32,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#2563EB',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ₹${Number(ctx.raw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: '"IBM Plex Mono", monospace', size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { family: '"IBM Plex Mono", monospace', size: 11 },
              callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data]);

  return (
    <div className="relative h-[260px] w-full">
      <canvas ref={canvasRef} aria-label="Line chart displaying daily spending trends" />
    </div>
  );
};
