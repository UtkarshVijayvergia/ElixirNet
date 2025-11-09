import { getComparisonData } from '@/lib/api';
import VisualizationClient from '@/components/visualizations/visualization-client';
import { format } from 'date-fns';

export default async function VisualizationsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const today = new Date();
  const selectedDate = searchParams?.date || format(today, 'yyyy-MM-dd');
  const comparisonData = await getComparisonData(selectedDate);
  
  return (
    <VisualizationClient 
      initialData={comparisonData}
      initialDate={selectedDate}
    />
  );
}
