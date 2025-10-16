/**
 * Lazy Chart Component
 * 
 * Progressive loading wrapper for Chart.js components
 * to improve initial page load performance
 */

import React, { Suspense, lazy } from 'react';
import { SkeletonChart } from './SkeletonLoader';
import ErrorBoundary from './ErrorBoundary';

// Lazy load Chart.js components
const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const LazyBar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const LazyPie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const LazyDoughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));

interface LazyChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any;
  options?: any;
  className?: string;
}

/**
 * Lazy-loaded chart component with skeleton loader
 */
export default function LazyChart({ type, data, options, className = '' }: LazyChartProps) {
  const ChartComponent = {
    line: LazyLine,
    bar: LazyBar,
    pie: LazyPie,
    doughnut: LazyDoughnut,
  }[type];

  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonChart />}>
        <div className={className}>
          <ChartComponent data={data} options={options} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// Preset chart components
export function LineChart({ data, options, className }: Omit<LazyChartProps, 'type'>) {
  return <LazyChart type="line" data={data} options={options} className={className} />;
}

export function BarChart({ data, options, className }: Omit<LazyChartProps, 'type'>) {
  return <LazyChart type="bar" data={data} options={options} className={className} />;
}

export function PieChart({ data, options, className }: Omit<LazyChartProps, 'type'>) {
  return <LazyChart type="pie" data={data} options={options} className={className} />;
}

export function DoughnutChart({ data, options, className }: Omit<LazyChartProps, 'type'>) {
  return <LazyChart type="doughnut" data={data} options={options} className={className} />;
}

/**
 * Hook for progressive chart data loading
 * Loads data in chunks for better perceived performance
 */
export function useProgressiveChartData<T>(
  fullData: T[],
  chunkSize: number = 10,
  delayMs: number = 100
) {
  const [displayedData, setDisplayedData] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setDisplayedData([]);
    setIsLoading(true);

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      const nextChunk = fullData.slice(currentIndex, currentIndex + chunkSize);
      
      if (nextChunk.length === 0) {
        clearInterval(intervalId);
        setIsLoading(false);
        return;
      }

      setDisplayedData(prev => [...prev, ...nextChunk]);
      currentIndex += chunkSize;

      if (currentIndex >= fullData.length) {
        clearInterval(intervalId);
        setIsLoading(false);
      }
    }, delayMs);

    return () => clearInterval(intervalId);
  }, [fullData, chunkSize, delayMs]);

  return { displayedData, isLoading };
}


