import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Home from '../page';
import { useSession } from 'next-auth/react';

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
});