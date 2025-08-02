'use client';

import { useState, useEffect } from 'react';

interface PartRoutingsManagerTestProps {
  partId: string;
}

export function PartRoutingsManagerTest({ partId }: PartRoutingsManagerTestProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just test basic rendering
    console.log('PartRoutingsManagerTest mounted with partId:', partId);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, [partId]);

  if (loading) {
    return <div className="p-6">Loading test component...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Part Routings Test Component</h2>
      <p>Part ID: {partId}</p>
      <p>Component is rendering successfully!</p>
    </div>
  );
}