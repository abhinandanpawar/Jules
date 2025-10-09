'use client';

import { signIn } from 'next-auth/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface WelcomeProps {
  isConfigured: boolean;
}

export default function Welcome({ isConfigured }: WelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center p-8 max-w-lg mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Jules Command Center</h1>
        <p className="text-lg text-muted-foreground mb-8">
          To get started, connect your GitHub account to manage your repositories and issues directly from this board.
        </p>
        {isConfigured ? (
          <button
            onClick={() => signIn('github')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Sign in with GitHub
          </button>
        ) : (
          <div className="bg-destructive/10 text-destructive-foreground p-6 rounded-lg text-center w-full border border-destructive/30">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-destructive"/>
            <h3 className="mt-4 text-xl font-bold">Configuration Error</h3>
            <p className="mt-2 font-mono text-sm bg-destructive/20 p-3 rounded-md">
              The application is missing `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET`.
            </p>
            <p className="mt-4 text-muted-foreground">
              Please ask the administrator to set these environment variables in the `.env.local` file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}