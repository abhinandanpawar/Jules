'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { data: session, status } = useSession();

  const renderContent = () => {
    if (status === 'loading') {
      return <p className="text-muted-foreground">Loading session...</p>;
    }

    if (status === 'authenticated' && session?.user) {
      return (
        <div className="space-y-4">
          <p className="text-lg">
            You are connected to GitHub as{' '}
            <span className="font-bold text-primary">{session.user.name}</span>
            <span className="text-muted-foreground"> ({session.user.email})</span>.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Disconnect from GitHub
          </button>
        </div>
      );
    }

    return (
      <div>
        <p className="text-lg text-muted-foreground">You are not connected to GitHub.</p>
        <p className="mt-2 text-sm">
          Return to the <Link href="/" className="text-primary hover:underline">homepage</Link> to connect your account.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8 bg-card border border-border rounded-xl shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeftIcon className="h-6 w-6" />
            <span className="sr-only">Back to board</span>
          </Link>
        </div>

        <div className="p-6 bg-input/50 rounded-lg">
          {renderContent()}
        </div>

        <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-muted-foreground mb-3">Manual Configuration</h2>
            <p className="text-sm text-muted-foreground mb-4">
                As an alternative to the GitHub App connection, you can provide a Personal Access Token (PAT). This is not recommended for most users.
            </p>
            <form>
                <label htmlFor="pat" className="block text-sm font-medium text-muted-foreground mb-2">GitHub Personal Access Token</label>
                <input
                    type="password"
                    id="pat"
                    name="pat"
                    className="w-full bg-input border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    placeholder="ghp_..."
                    disabled
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Manual PAT configuration is not yet implemented. Please use the "Connect to GitHub" flow.
                </p>
            </form>
        </div>

      </div>
    </div>
  );
}