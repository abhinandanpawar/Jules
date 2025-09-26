import { NextResponse } from 'next/server';

/**
 * GET /api/config
 * Returns the list of repositories configured in the environment variables.
 */
export async function GET() {
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