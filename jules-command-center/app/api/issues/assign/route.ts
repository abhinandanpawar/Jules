import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
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
        'Authorization': `Bearer ${accessToken}`,
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