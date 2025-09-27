import { NextResponse } from 'next/server';

const GITHUB_PAT = process.env.GITHUB_PAT;

export async function GET() {
  if (!GITHUB_PAT) {
    return NextResponse.json({ error: 'GitHub PAT is not configured.' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user from GitHub.');
    }

    const userData = await response.json();
    return NextResponse.json({ login: userData.login });

  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    return NextResponse.json({ error: 'Failed to fetch user.' }, { status: 500 });
  }
}