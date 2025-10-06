import React from 'react';
import { render, screen } from '@testing-library/react';
import Welcome from '../components/Welcome';

// Mock the next-auth/react module
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

describe('Welcome Component', () => {
  it('should render a "Sign in with GitHub" button', () => {
    render(<Welcome isConfigured={true} />);

    const signInButton = screen.getByRole('button', { name: /sign in with github/i });

    expect(signInButton).toBeInTheDocument();
  });
});