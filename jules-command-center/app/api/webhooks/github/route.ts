import { NextResponse } from 'next/server';

// --- HELPER FUNCTION TO CALL THE AI API ---
async function getCommentIntent(comment: string): Promise<string> {
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;

  if (!AI_API_URL) {
    throw new Error('AI API URL is not configured.');
  }

  const payload = {
    model: "TinyLlama-1.1B-Chat-v1.0",
    messages: [
      {
        role: "system",
        content: "Analyze the following GitHub comment and classify its intent. Respond with a single word: 'Approved', 'ChangesRequested', or 'Commented'."
      },
      {
        role: "user",
        content: comment
      }
    ]
  };

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('AI service failed to classify the comment.');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content.trim() || 'Commented';
}

// --- HELPER FUNCTION TO UPDATE GITHUB LABELS ---
async function updateGitHubIssueLabel(repo: string, issueNumber: number, intent: string) {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  if (!GITHUB_PAT) {
    throw new Error('GitHub PAT is not configured.');
  }

  const statusLabel = `jules-status:${intent.toLowerCase()}`;
  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/labels`;

  // First, we might want to remove any existing jules-status labels to avoid conflicts.
  // For simplicity in this implementation, we will just add the new one.
  // A more robust solution would fetch existing labels and remove old status labels.

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([statusLabel]),
  });
}

// --- MAIN WEBHOOK HANDLER ---
export async function POST(request: Request) {
  // In a real application, you MUST verify the webhook signature here for security.

  try {
    const payload = await request.json();
    const eventType = request.headers.get('x-github-event');

    // We only care about new comments on issues or pull requests
    if ((eventType === 'issue_comment' || eventType === 'pull_request_review_comment') && payload.action === 'created') {
      const commentBody = payload.comment.body;
      const repoFullName = payload.repository.full_name;
      const issueNumber = payload.issue?.number || payload.pull_request?.number;

      if (!commentBody || !repoFullName || !issueNumber) {
        return NextResponse.json({ message: 'Webhook received, but missing necessary data.' });
      }

      // Get the intent from the AI
      const intent = await getCommentIntent(commentBody);

      // Update the GitHub issue with the new status label
      await updateGitHubIssueLabel(repoFullName, issueNumber, intent);

      return NextResponse.json({ message: `Successfully processed comment and set status to '${intent}'.` });
    }

    return NextResponse.json({ message: 'Webhook received, but event is not relevant.' });

  } catch (error: any) {
    console.error('Error processing webhook:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook.' }, { status: 500 });
  }
}