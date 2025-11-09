import VisualizationClient from '@/components/visualizations/visualization-client';
import { getCauldrons } from '@/lib/api';

export default async function VisualizationsPage() {
  const cauldrons = await getCauldrons();
  return (
    <VisualizationClient cauldrons={cauldrons} />
  );
}
