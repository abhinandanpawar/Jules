import { NextResponse } from 'next/server';

const GITHUB_PAT = process.env.GITHUB_PAT;

export async function POST(request: Request) {
  if (!GITHUB_PAT) {
    return NextResponse.json({ error: 'GitHub PAT is not configured.' }, { status: 500 });
  }

  try {
    const { repo, issueNumber, assignee } = await request.json();

    if (!repo || !issueNumber || !assignee) {
      return NextResponse.json({ error: 'Missing repo, issueNumber, or assignee in request body.' }, { status: 400 });
    }

    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/assignees`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignees: [assignee] }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API Error:', errorData);
      throw new Error(errorData.message || `Failed to assign issue #${issueNumber} in ${repo}.`);
    }

    const updatedIssue = await response.json();
    return NextResponse.json(updatedIssue);

  } catch (error: any) {
    console.error('Error assigning issue:', error.message);
    return NextResponse.json({ error: 'Failed to assign issue.' }, { status: 500 });
  }
}