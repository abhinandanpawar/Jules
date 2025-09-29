import { NextResponse } from 'next/server';

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
  closed_at: string | null;
  user: {
    login: string;
  };
  labels: {
    name: string;
  }[];
}

/**
 * GET /api/issues
 * Fetches issues from the repositories specified in the GITHUB_REPOS environment variable.
 * It can fetch 'open', 'closed', or 'all' issues based on the 'state' query parameter.
 * Defaults to 'open' if no state is provided.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'open'; // Default to 'open'

  const GITHUB_PAT = process.env.GITHUB_PAT;
  const GITHUB_REPOS = process.env.GITHUB_REPOS;

  if (!GITHUB_PAT || !GITHUB_REPOS) {
    return NextResponse.json(
      { error: 'GitHub Personal Access Token (GITHUB_PAT) and repositories (GITHUB_REPOS) must be configured in your .env.local file.' },
      { status: 400 } // Using 400 for bad request/missing configuration
    );
  }

  const repoList = GITHUB_REPOS.split(',').map(repo => repo.trim());
  const allIssues: GitHubIssue[] = [];

  try {
    const fetchPromises = repoList.map(async (repo) => {
      const url = `https://api.github.com/repos/${repo}/issues?state=${state}&per_page=100`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issues for ${repo}. Status: ${response.status}`);
      }

      const issues: GitHubIssue[] = await response.json();
      // Add the full repo name to each issue for frontend use, which is more robust.
      return issues.map(issue => ({ ...issue, repository: { name: repo } }));
    });

    const nestedIssues = await Promise.all(fetchPromises);
    const allIssues = nestedIssues.flat(); // Flatten the array of arrays into a single list

    // Sort issues by creation date, newest first
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
  const GITHUB_PAT = process.env.GITHUB_PAT;

  if (!GITHUB_PAT) {
    return NextResponse.json(
      { error: 'GitHub Personal Access Token (GITHUB_PAT) must be configured.' },
      { status: 400 }
    );
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
        Authorization: `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: body || '', // Body is optional
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('GitHub API Error on issue creation:', errorDetails);
      throw new Error(`Failed to create issue in ${repo}. Status: ${response.status}`);
    }

    const newIssue = await response.json();
    return NextResponse.json(newIssue, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: 'Failed to create issue.', details: error.message }, { status: 500 });
  }
}