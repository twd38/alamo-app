import { redirect } from 'next/navigation';

export default function ProductionPage() {
  // Redirect to work orders by default
  redirect('/production/work-orders');
}