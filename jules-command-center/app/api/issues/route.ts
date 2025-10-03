import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Define a type for the GitHub Issue for better type-safety
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  repository: {
    name: string;
  };
  state: string;
  assignee: any;
  created_at: string;
  user: {
    login: string;
  };
  labels: {
    name: string;
  }[];
}

/**
 * GET /api/issues
 * Fetches all open issues from the repositories specified in the GITHUB_REPOS environment variable.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;
  const GITHUB_REPOS = process.env.GITHUB_REPOS;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  if (!GITHUB_REPOS) {
    return NextResponse.json(
      { error: 'Repository list (GITHUB_REPOS) is not configured in your .env.local file.' },
      { status: 400 }
    );
  }

  const repoList = GITHUB_REPOS.split(',').map(repo => repo.trim());

  try {
    const fetchPromises = repoList.map(async (repo) => {
      const url = `https://api.github.com/repos/${repo}/issues?state=open`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issues for ${repo}. Status: ${response.status}`);
      }

      const issues: GitHubIssue[] = await response.json();
      return issues.map(issue => ({ ...issue, repository: { name: repo } }));
    });

    const nestedIssues = await Promise.all(fetchPromises);
    const allIssues = nestedIssues.flat();

    allIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(allIssues);

  } catch (error: any) {
    console.error('GitHub API Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch issues from GitHub.', details: error.message }, { status: 500 });
  }
}

/**
 * POST /api/issues
 * Creates a new issue in a specified repository.
 * Expects a body with { title: string, repo: string, body?: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const { title, repo, body } = await request.json();

    if (!title || !repo) {
      return NextResponse.json({ error: 'Title and repo are required fields.' }, { status: 400 });
    }

    const url = `https://api.github.com/repos/${repo}/issues`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: body || '',
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('GitHub API Error on issue creation:', errorDetails);
      throw new Error(`Failed to create issue in ${repo}. Status: ${response.status}`);
    }

    const newIssue = await response.json();
    return NextResponse.json(newIssue, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: 'Failed to create issue.', details: error.message }, { status: 500 });
  }
}