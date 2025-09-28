import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock the child components that make external calls or are complex
jest.mock('@/components/KanbanBoard', () => () => <div>Kanban Board</div>);

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /Jules Command Center/i,
    });

    expect(heading).toBeInTheDocument();
  });
});