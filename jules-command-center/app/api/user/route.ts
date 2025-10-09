import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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