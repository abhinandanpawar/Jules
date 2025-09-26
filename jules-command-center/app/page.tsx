'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

// --- TYPE DEFINITIONS ---
interface Task {
  id: number;
  title: string;
  number: number;
  repository: {
    name: string;
  };
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

// --- COMPONENTS ---

const TaskCard = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString(), data: { type: 'Task', task } });

  const style = { transform: CSS.Transform.toString(transform), transition };

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="bg-gray-700 p-3 rounded-md shadow-md h-[72px] opacity-50 border-2 border-indigo-500" />;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-gray-700 p-3 rounded-md shadow-md hover:bg-gray-600 cursor-grab active:cursor-grabbing transition-colors">
      <p className="font-semibold text-gray-100 line-clamp-2">{task.title}</p>
      <p className="text-sm text-gray-400 mt-1 truncate">{task.repository.name} #{task.number}</p>
    </div>
  );
};

const KanbanColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });
  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-gray-200 mb-4 tracking-wide">{column.title}</h2>
      <SortableContext items={tasks.map(t => t.id.toString())} strategy={rectSortingStrategy}>
        <div className="space-y-4">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </SortableContext>
    </div>
  );
};

const NewTaskModal = ({ repos, onClose, onTaskCreated }: { repos: string[], onClose: () => void, onTaskCreated: (newTask: Task) => void }) => {
    const [title, setTitle] = useState('');
    const [repo, setRepo] = useState(repos[0] || '');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !repo) {
            setError('Title and repository are required.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, repo, body }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create issue.');
            }

            const newTask: Task = await response.json();
            onTaskCreated(newTask);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-300 mb-2">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="repo" className="block text-gray-300 mb-2">Repository</label>
                        <select id="repo" value={repo} onChange={e => setRepo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                            {repos.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="body" className="block text-gray-300 mb-2">Description (Optional)</label>
                        <textarea id="body" value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                    </div>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN KANBAN BOARD PAGE ---
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [configuredRepos, setConfiguredRepos] = useState<string[]>([]);
  const [taskColumnMapping, setTaskColumnMapping] = useState<{ [key: string]: ColumnId }>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both issues and config in parallel for faster loading
        const [issuesResponse, configResponse] = await Promise.all([
          fetch('/api/issues'),
          fetch('/api/config')
        ]);

        if (!issuesResponse.ok) {
          throw new Error((await issuesResponse.json()).error || 'Failed to fetch issues.');
        }
        if (!configResponse.ok) {
          throw new Error((await configResponse.json()).error || 'Failed to fetch config.');
        }

        const issues: Task[] = await issuesResponse.json();
        const config: { repos: string[] } = await configResponse.json();

        setTasks(issues);
        setConfiguredRepos(config.repos.sort());

        const initialMapping = issues.reduce((acc, task) => ({...acc, [task.id.toString()]: 'backlog'}), {});
        setTaskColumnMapping(initialMapping);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    setTaskColumnMapping(prev => ({ ...prev, [newTask.id.toString()]: 'backlog' }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => e.active.data.current?.type === 'Task' && setActiveTask(e.active.data.current.task);
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = active.id.toString();
    const overId = over.id.toString();
    if (active.data.current?.type !== 'Task') return;

    const overColumnId = over.data.current?.type === 'Column' ? overId : taskColumnMapping[overId];
    if (overColumnId) {
      setTaskColumnMapping(prev => ({ ...prev, [activeId]: overColumnId }));
    }
  };

  const renderContent = () => {
    if (isLoading) return <p className="text-gray-400 text-center w-full">Loading issues...</p>;
    if (error) return (
        <div className="text-red-400 bg-red-900/20 p-4 rounded-lg text-center w-full">
            <p className="font-bold">An error occurred:</p>
            <p className="mt-2 font-mono text-sm">{error}</p>
            <p className="mt-4 text-gray-300">Please ensure your GITHUB_PAT and GITHUB_REPOS are correctly configured.</p>
        </div>
    );
    return (
      <SortableContext items={initialColumns.map(c => c.id)} strategy={rectSortingStrategy}>
        {initialColumns.map(column => (
          <KanbanColumn key={column.id} column={column} tasks={tasks.filter(t => taskColumnMapping[t.id.toString()] === column.id)} />
        ))}
      </SortableContext>
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Jules Command Center</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors" disabled={isLoading || !!error}>
            New Task
          </button>
        </header>
        <main className="flex p-4 space-x-4 overflow-x-auto">
          {renderContent()}
        </main>
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
      {isModalOpen && <NewTaskModal repos={configuredRepos} onClose={() => setIsModalOpen(false)} onTaskCreated={handleTaskCreated} />}
    </DndContext>
  );
}