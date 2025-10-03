import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET /api/status
 * Checks the application's configuration and user authentication status.
 *
 * Returns:
 * - isConfigured: boolean - Whether the required GitHub OAuth env vars are set.
 * - hasSession: boolean - Whether the user has an active session.
 */
export async function GET(req: Request) {
  const isConfigured = !!(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );

  // We need to pass the request and response objects to getServerSession when used in a route handler
  // However, the latest Next.js route handler signature doesn't provide res.
  // Instead, we can just pass the authOptions.
  const session = await getServerSession(authOptions);
  const hasSession = !!session;

  return NextResponse.json({
    isConfigured,
    hasSession,
  });
}