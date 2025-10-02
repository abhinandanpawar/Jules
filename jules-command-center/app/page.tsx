'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { templates } from '../lib/prompt-templates';
import { PlusIcon, SparklesIcon, ExclamationTriangleIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';


// --- TYPE DEFINITIONS ---
interface Task {
  id: number;
  title: string;
  number: number;
  repository: { name: string };
  labels: { name: string }[];
}

interface Column {
  id: string;
  title: string;
}

type ColumnId = Column['id'];

// --- CONSTANTS ---
const initialColumns: Column[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'ready', title: 'Ready for Jules' },
  { id: 'working', title: 'Jules Working' },
  { id: 'review', title: 'Review Required' },
  { id: 'done', title: 'Done' },
];

// --- HELPER FUNCTION ---
const getColumnIdFromLabels = (labels: { name: string }[]): ColumnId => {
  const statusLabel = labels.find(label => label.name.startsWith('jules-status:'));
  if (statusLabel) {
    const status = statusLabel.name.split(':')[1];
    if (initialColumns.some(c => c.id === status)) {
      return status as ColumnId;
    }
  }
  return 'backlog';
};


// --- COMPONENTS ---

const TaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString(), data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card p-4 rounded-lg shadow-md border border-border hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all duration-200"
    >
      <p className="font-medium text-card-foreground leading-snug line-clamp-2">{task.title}</p>
      <p className="text-sm text-muted-foreground mt-2 truncate">
        {task.repository.name} #{task.number}
      </p>
    </div>
  );
};

const KanbanColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 bg-background/50 rounded-xl p-1 h-full">
      <div className="p-3">
        <h2 className="text-md font-semibold text-foreground tracking-wide uppercase">{column.title}</h2>
      </div>
      <SortableContext items={tasks.map(t => t.id.toString())} strategy={rectSortingStrategy}>
        <div className="space-y-3 p-3 overflow-y-auto h-[calc(100%-4rem)]">
          {tasks.length > 0 ? (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center text-muted-foreground pt-8">No tasks</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const NewTaskModal = ({ repos, onClose, onTaskCreated }: { repos: string[], onClose: () => void, onTaskCreated: (newTask: Task) => void }) => {
    const [title, setTitle] = useState('');
    const [repo, setRepo] = useState(repos[0] || '');
    const [taskType, setTaskType] = useState('general');
    const [body, setBody] = useState(templates.general.template);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        setBody(templates[taskType]?.template || '');
    }, [taskType]);

    const handleSuggestPrompt = async () => {
        setIsSuggesting(true);
        const suggestionToast = toast.loading('Improving with AI...');
        try {
            const response = await fetch('/api/ai/suggest-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: body }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to get suggestion.');
            const { suggested_prompt } = await response.json();
            setBody(suggested_prompt);
            toast.success('Prompt improved!', { id: suggestionToast });
        } catch (err: any) {
            toast.error(err.message, { id: suggestionToast });
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !repo) {
            toast.error('Title and repository are required.');
            return;
        }
        setIsSubmitting(true);
        const creationToast = toast.loading('Creating task...');
        try {
            const response = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, repo, body }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to create issue.');
            const newTask: Task = await response.json();
            onTaskCreated(newTask);
            toast.success(`Task #${newTask.number} created!`, { id: creationToast });
            onClose();
        } catch (err: any) {
            toast.error(err.message, { id: creationToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="repo" className="block text-muted-foreground mb-2 text-sm">Repository</label>
                            <select id="repo" value={repo} onChange={e => setRepo(e.target.value)} className="w-full bg-input border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors" required>
                                {repos.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="taskType" className="block text-muted-foreground mb-2 text-sm">Task Type</label>
                            <select id="taskType" value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full bg-input border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                                {Object.entries(templates).map(([key, { name }]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-muted-foreground mb-2 text-sm">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-input border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors" required />
                    </div>
                    <div className="mb-2 flex justify-between items-center">
                        <label htmlFor="body" className="block text-muted-foreground text-sm">Description</label>
                        <button type="button" onClick={handleSuggestPrompt} disabled={isSuggesting} className="flex items-center gap-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="h-4 w-4"/>
                            {isSuggesting ? 'Improving...' : 'Improve with AI'}
                        </button>
                    </div>
                    <div className="mb-6">
                        <textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={10} className="w-full bg-input border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm transition-colors"></textarea>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import { useSession } from 'next-auth/react';
import Welcome from './components/Welcome';

// --- MAIN KANBAN BOARD PAGE ---
export default function Home() {
  // Authentication and configuration state
  const { data: session, status } = useSession();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // Kanban board state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [configuredRepos, setConfiguredRepos] = useState<string[]>([]);
  const [taskColumnMapping, setTaskColumnMapping] = useState<{ [key: string]: ColumnId }>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [julesLogin, setJulesLogin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('all');

  // Check app status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const { isConfigured: configured } = await res.json();
        setIsConfigured(configured);
      } catch (err) {
        // If status fails, assume not configured
        setIsConfigured(false);
      } finally {
        setIsStatusLoading(false);
      }
    };
    checkStatus();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => selectedRepo === 'all' || task.repository.name === selectedRepo)
      .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tasks, searchTerm, selectedRepo]);

  const fetchData = async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const issuesResponse = await fetch('/api/issues');
      if (!issuesResponse.ok) throw new Error((await issuesResponse.json()).error || 'Failed to fetch issues.');
      const issues: Task[] = await issuesResponse.json();
      setTasks(issues);

      const newMapping = issues.reduce((acc, task) => {
          acc[task.id.toString()] = getColumnIdFromLabels(task.labels);
          return acc;
      }, {} as { [key: string]: ColumnId });
      setTaskColumnMapping(newMapping);

      if (error) setError(null); // Clear error on successful fetch
      return true;

    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  };

  const fetchConfig = async () => {
      try {
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) throw new Error((await configResponse.json()).error || 'Failed to fetch config.');
        const config: { repos: string[] } = await configResponse.json();
        setConfiguredRepos(config.repos.sort());
      } catch(err: any) {
        setError(err.message);
      }
  };

  const fetchJulesUser = async () => {
      try {
          const res = await fetch('/api/user');
          if (!res.ok) return;
          const { login } = await res.json();
          setJulesLogin(login);
      } catch (e) {
          console.error("Could not fetch Jules' user login.");
      }
  }

  useEffect(() => {
    if (session) {
      fetchConfig();
      fetchData(true);
      fetchJulesUser();
      const intervalId = setInterval(() => fetchData(), 15000); // Poll every 15 seconds
      return () => clearInterval(intervalId);
    }
  }, [session]);

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    setTaskColumnMapping(prev => ({ ...prev, [newTask.id.toString()]: 'backlog' }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => e.active.data.current?.type === 'Task' && setActiveTask(e.active.data.current.task);
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const activeTask = tasks.find(t => t.id.toString() === activeId);
    if (!activeTask) return;

    const overId = over.id.toString();
    const overColumnId = over.data.current?.type === 'Column' ? overId : taskColumnMapping[overId];
    if (!overColumnId) return;

    // Optimistically update the UI
    setTaskColumnMapping(prev => ({ ...prev, [activeId]: overColumnId }));
    toast.success(`Moved to ${initialColumns.find(c => c.id === overColumnId)?.title}`);

    // If moved to "Ready for Jules", assign the issue
    if (overColumnId === 'ready' && julesLogin) {
      try {
        const res = await fetch('/api/issues/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo: activeTask.repository.name,
            issueNumber: activeTask.number,
            assignee: julesLogin,
          }),
        });
        if (!res.ok) throw new Error('Failed to assign issue.');
        toast.success(`Assigned task #${activeTask.number} to ${julesLogin}.`);
      } catch (err) {
        toast.error('Could not assign task.');
        // Revert the optimistic update on failure
        setTaskColumnMapping(prev => ({ ...prev, [activeId]: taskColumnMapping[activeId] }));
      }
    }
  };

  // --- RENDER LOGIC ---

  if (isStatusLoading || status === 'loading') {
    return <div className="text-muted-foreground text-center w-full min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Welcome isConfigured={isConfigured} />;
  }

  const renderBoardContent = () => {
    if (isLoading) return <div className="text-muted-foreground text-center w-full pt-20">Loading board...</div>;
    if (error) return (
        <div className="bg-destructive/10 text-destructive-foreground p-6 rounded-lg text-center w-full max-w-2xl mx-auto border border-destructive/30">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-destructive"/>
            <h3 className="mt-4 text-xl font-bold">An error occurred</h3>
            <p className="mt-2 font-mono text-sm bg-destructive/20 p-3 rounded-md">{error}</p>
            <p className="mt-4 text-muted-foreground">There was an issue fetching data from GitHub. Please check your connection or repository configuration.</p>
        </div>
    );
    return (
      <SortableContext items={initialColumns.map(c => c.id)} strategy={rectSortingStrategy}>
        {initialColumns.map(column => (
          <KanbanColumn key={column.id} column={column} tasks={filteredTasks.filter(t => taskColumnMapping[t.id.toString()] === column.id)} />
        ))}
      </SortableContext>
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen font-sans bg-grid-gray-700/[0.2]">
        <header className="p-4 flex justify-between items-center gap-4 backdrop-blur-sm bg-background/80 border-b border-border fixed top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-foreground">Jules Command Center</h1>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-input border-border rounded-md px-3 py-1.5 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <select
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
                className="bg-input border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="all">All Repositories</option>
                {configuredRepos.map(repo => (
                  <option key={repo} value={repo}>{repo}</option>
                ))}
              </select>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/analytics" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Analytics
            </Link>
             <Link href="/settings" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
            </Link>
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" disabled={isLoading || !!error}>
              <PlusIcon className="h-5 w-5"/>
              New Task
            </button>
          </div>
        </header>
        <main className="flex p-4 space-x-4 h-screen pt-20">
          {renderBoardContent()}
        </main>
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
      {isModalOpen && <NewTaskModal repos={configuredRepos} onClose={() => setIsModalOpen(false)} onTaskCreated={handleTaskCreated} />}
    </DndContext>
  );
}