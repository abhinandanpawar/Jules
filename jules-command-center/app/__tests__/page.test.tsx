import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Home from '../page';
import { useSession } from 'next-auth/react';
import { DragEndEvent } from '@dnd-kit/core';

// Mock the next-auth session hook
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;

// Mock the Welcome component as it's tested separately
jest.mock('../components/Welcome', () => ({
  __esModule: true,
  default: ({ isConfigured }: { isConfigured: boolean }) => (
    <div>
      <h1>Welcome Screen</h1>
      <p>Configured: {isConfigured.toString()}</p>
      <button>Connect to GitHub</button>
    </div>
  ),
}));

// Mock react-hot-toast to prevent errors in test environment
jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
    },
    Toaster: () => null,
}));

// Mock dnd-kit to capture the onDragEnd handler
let capturedOnDragEnd: (event: DragEndEvent) => void;
jest.mock('@dnd-kit/core', () => {
    const originalDndKit = jest.requireActual('@dnd-kit/core');
    return {
        ...originalDndKit,
        DndContext: (props: any) => {
            capturedOnDragEnd = props.onDragEnd;
            return <originalDndKit.DndContext {...props} />;
        },
    };
});


// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;


describe('Home Page', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        mockUseSession.mockClear();
        const toast = jest.requireMock('react-hot-toast').default;
        toast.success.mockClear();
        toast.error.mockClear();
        toast.loading.mockClear();
    });

    it('renders the Welcome screen when unauthenticated', async () => {
        // Arrange
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ isConfigured: true }),
        });

        // Act
        render(<Home />);

        // Assert
        expect(await screen.findByText('Welcome Screen')).toBeInTheDocument();
        expect(screen.getByText('Configured: true')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Connect to GitHub/i })).toBeInTheDocument();
    });

    it('renders the Kanban board when authenticated', async () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User' } },
            status: 'authenticated',
        });

        // Mock all the API calls made by the authenticated view
        (global.fetch as jest.Mock).mockImplementation(async (url) => {
            if (url.toString().endsWith('/api/status')) {
                return { ok: true, json: async () => ({ isConfigured: true }) };
            }
            if (url.toString().endsWith('/api/config')) {
                return { ok: true, json: async () => ({ repos: ['test/repo'] }) };
            }
            if (url.toString().endsWith('/api/issues')) {
                return { ok: true, json: async () => ([]) }; // Return empty array for issues
            }
            if (url.toString().endsWith('/api/user')) {
                return { ok: true, json: async () => ({ login: 'test-user' }) };
            }
            return { ok: false, json: async () => ({ error: 'Unhandled API call' }) };
        });

        // Act
        await act(async () => {
          render(<Home />);
        });

        // Assert
        // Check for an element specific to the authenticated Kanban board view
        expect(await screen.findByRole('button', { name: /New Task/i })).toBeInTheDocument();
        // Ensure the welcome screen is not present
        expect(screen.queryByText('Welcome Screen')).not.toBeInTheDocument();
    });

    it('shows a loading state initially', () => {
        // Arrange
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });

        // Act
        render(<Home />);

        // Assert
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('reverts task position on failed API call after drag and drop', async () => {
        // 1. Arrange
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User' } },
            status: 'authenticated',
        });

        const mockTask = {
            id: 123,
            title: 'My Test Task',
            number: 42,
            repository: { name: 'test/repo' },
            labels: [{ name: 'jules-status:backlog' }], // Starts in backlog
        };

        // Mock API calls
        (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
            const urlString = url.toString();
            if (urlString.endsWith('/api/status')) {
                return { ok: true, json: async () => ({ isConfigured: true }) };
            }
            if (urlString.endsWith('/api/config')) {
                return { ok: true, json: async () => ({ repos: ['test/repo'] }) };
            }
            if (urlString.endsWith('/api/issues') && options?.method !== 'POST') {
                return { ok: true, json: async () => [mockTask] };
            }
            if (urlString.endsWith('/api/user')) {
                return { ok: true, json: async () => ({ login: 'jules-bot' }) };
            }
            // This is the call that should fail when assigning the issue
            if (urlString.endsWith('/api/issues/assign')) {
                return { ok: false, status: 500, json: async () => ({ error: 'Failed to assign' }) };
            }
            return { ok: false, json: async () => ({ error: 'Unhandled API call' }) };
        });

        // Act: Render the component
        await act(async () => {
          render(<Home />);
        });

        // Assert initial state: Task should be in the 'Backlog' column
        const backlogColumn = await screen.findByText('Backlog');
        const backlogContainer = backlogColumn.closest('.flex-shrink-0');
        expect(backlogContainer).toHaveTextContent(mockTask.title);

        // 2. Simulate Drag and Drop to 'Ready for Jules' column
        const dragEndEvent: DragEndEvent = {
            active: {
                id: mockTask.id.toString(),
                data: { current: { type: 'Task', task: mockTask } },
            },
            over: {
                id: 'ready', // The ID of the target column
                data: { current: { type: 'Column' } },
            },
        };

        // Act: Call the captured onDragEnd handler
        await act(async () => {
            if (capturedOnDragEnd) {
                capturedOnDragEnd(dragEndEvent);
            }
        });

        // 3. Assert final state
        const toast = jest.requireMock('react-hot-toast').default;
        expect(toast.error).toHaveBeenCalledWith('Could not assign task.');

        // The task should have reverted to the 'Backlog' column
        const finalBacklogContainer = (await screen.findByText('Backlog')).closest('.flex-shrink-0');
        const finalReadyContainer = (await screen.findByText('Ready for Jules')).closest('.flex-shrink-0');

        expect(finalBacklogContainer).toHaveTextContent(mockTask.title);
        expect(finalReadyContainer).not.toHaveTextContent(mockTask.title);
    });
});