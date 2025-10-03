import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET /api/config
 * Returns the list of repositories configured in the environment variables.
 * Requires an active user session.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const GITHUB_REPOS = process.env.GITHUB_REPOS;

  if (!GITHUB_REPOS) {
    return NextResponse.json(
      { error: 'Repository list (GITHUB_REPOS) is not configured in your .env.local file.' },
      { status: 400 }
    );
  }

  const repoList = GITHUB_REPOS.split(',').map(repo => repo.trim());

  return NextResponse.json({ repos: repoList });
}