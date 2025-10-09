'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Placeholder for analytics data structure
interface AnalyticsData {
  totalTasks: number;
  avgCompletionTime: string; // e.g., "3 days"
  tasksPerRepo: { name: string; count: number }[];
}

const AnalyticsPage = () => {
  // In a real implementation, this data would be fetched from an API
  const analyticsData: AnalyticsData = {
    totalTasks: 0,
    avgCompletionTime: 'N/A',
    tasksPerRepo: [],
  };

  const isLoading = true; // Simulating loading state

  return (
    <div className="min-h-screen font-sans bg-background text-foreground">
      <header className="p-4 flex justify-between items-center backdrop-blur-sm bg-background/80 border-b border-border fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeftIcon className="h-5 w-5"/>
            Back to Board
          </Link>
          <h1 className="text-xl font-bold text-foreground">Jules Analytics</h1>
        </div>
      </header>
      <main className="p-8 pt-24">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-muted-foreground text-sm font-medium uppercase">Total Tasks Completed</h3>
              <p className="text-4xl font-bold mt-2 text-card-foreground">{analyticsData.totalTasks}</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-muted-foreground text-sm font-medium uppercase">Avg. Completion Time</h3>
              <p className="text-4xl font-bold mt-2 text-card-foreground">{analyticsData.avgCompletionTime}</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border col-span-1 md:col-span-3">
              <h3 className="text-muted-foreground text-sm font-medium uppercase mb-4">Tasks per Repository</h3>
              <div className="space-y-2">
                {analyticsData.tasksPerRepo.length > 0 ? analyticsData.tasksPerRepo.map(repo => (
                  <div key={repo.name} className="flex justify-between items-center bg-background/50 p-3 rounded-md">
                    <span className="text-foreground">{repo.name}</span>
                    <span className="font-bold text-lg text-foreground">{repo.count}</span>
                  </div>
                )) : <p className="text-muted-foreground">No data available.</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;