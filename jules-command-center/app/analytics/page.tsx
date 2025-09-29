'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ChartBarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// --- TYPE DEFINITIONS ---
interface Task {
  id: number;
  title: string;
  number: number;
  repository: { name: string };
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
}

// --- Reusable Components ---

const StatCard = ({ title, value, icon: Icon, isLoading }) => (
  <div className="bg-card p-6 rounded-xl border border-border">
    <div className="flex items-center gap-6">
        <div className="bg-primary/10 p-4 rounded-full">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            {isLoading ? (
                <div className="h-9 w-24 bg-input/80 rounded-md animate-pulse mt-1"></div>
            ) : (
                <p className="text-3xl font-bold text-foreground">{value}</p>
            )}
        </div>
    </div>
  </div>
);

const BarChart = ({ title, data, isLoading }) => (
  <div className="bg-card p-6 rounded-xl border border-border">
    <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-5 w-32 bg-input/80 rounded-md"></div>
                <div className="flex-1 bg-input/80 rounded-full h-6"></div>
            </div>
        ))
      ) : data.length > 0 ? (
        data.map(({ name, count, percentage }) => (
          <div key={name} className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground w-40 truncate" title={name}>{name}</p>
            <div className="flex-1 bg-input rounded-full h-6 relative">
              <div
                className="bg-primary h-6 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              >
                <span className="text-xs font-bold text-primary-foreground">{count}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-4">No data available.</p>
      )}
    </div>
  </div>
);

// --- Helper Functions ---
const formatDuration = (ms: number) => {
    if (ms < 0) return 'N/A';
    const days = ms / (1000 * 60 * 60 * 24);
    if (days > 1) return `${days.toFixed(1)} days`;
    const hours = ms / (1000 * 60 * 60);
    if (hours > 1) return `${hours.toFixed(1)} hours`;
    const minutes = ms / (1000 * 60);
    return `${minutes.toFixed(1)} minutes`;
}

// --- Main Analytics Page Component ---
export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    avgCompletionTime: 'N/A',
  });
  const [repoData, setRepoData] = useState<{name: string, count: number, percentage: number}[]>([]);

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/issues?state=all');
        if (!res.ok) throw new Error('Failed to fetch issues.');
        const tasks: Task[] = await res.json();

        // --- Process Data ---
        const closedTasks = tasks.filter(t => t.state === 'closed' && t.closed_at);

        // 1. Total Completed
        const totalCompleted = closedTasks.length;

        // 2. Average Completion Time
        let totalDuration = 0;
        const tasksWithDuration = closedTasks.filter(t => t.created_at && t.closed_at);
        tasksWithDuration.forEach(t => {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.closed_at!).getTime();
            totalDuration += (end - start);
        });
        const avgTime = tasksWithDuration.length > 0 ? formatDuration(totalDuration / tasksWithDuration.length) : 'N/A';

        setStats({ totalCompleted: totalCompleted, avgCompletionTime: avgTime });

        // 3. Tasks by Repository
        const repoCounts: { [key: string]: number } = {};
        closedTasks.forEach(task => {
            const repoName = task.repository.name;
            repoCounts[repoName] = (repoCounts[repoName] || 0) + 1;
        });

        const sortedRepoData = Object.entries(repoCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count, percentage: totalCompleted > 0 ? (count / totalCompleted) * 100 : 0 }));

        setRepoData(sortedRepoData);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndProcess();
  }, []);

  const renderContent = () => {
    if (error) return (
        <div className="bg-destructive/10 text-destructive-foreground p-6 rounded-lg text-center w-full max-w-2xl mx-auto border border-destructive/30">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-destructive"/>
            <h3 className="mt-4 text-xl font-bold">An error occurred</h3>
            <p className="mt-2 font-mono text-sm bg-destructive/20 p-3 rounded-md">{error}</p>
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Total Tasks Completed" value={stats.totalCompleted} icon={ChartBarIcon} isLoading={isLoading} />
                <StatCard title="Average Completion Time" value={stats.avgCompletionTime} icon={ClockIcon} isLoading={isLoading} />
            </div>
            <div className="grid grid-cols-1 gap-8">
                <BarChart title="Completed Tasks by Repository" data={repoData} isLoading={isLoading} />
            </div>
        </>
    )
  }

  return (
    <div className="min-h-screen bg-grid-gray-700/[0.2] font-sans text-foreground">
      <header className="p-4 backdrop-blur-sm bg-background/80 border-b border-border fixed top-0 left-0 right-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-foreground">Analytics Dashboard</h1>
        <Link href="/" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Board
        </Link>
      </header>
      <main className="p-8 pt-24 max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}