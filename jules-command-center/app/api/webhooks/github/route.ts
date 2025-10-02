import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

// --- CONSTANTS ---
const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;

// --- UTILITY FUNCTIONS ---

/**
 * Parses the issue number from a pull request body.
 * Looks for keywords like "closes #", "fixes #", etc.
 * @param body The PR body.
 * @returns The issue number or null if not found.
 */
function parseIssueNumberFromPrBody(body: string): number | null {
  if (!body) return null;
  const match = body.match(/(?:closes|fixes|resolves)\s+#(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Calls the AI service to determine the intent of a comment.
 * @param comment The text of the GitHub comment.
 * @returns The intent as a string (e.g., 'Approved', 'ChangesRequested').
 */
async function getCommentIntent(comment: string): Promise<string> {
  if (!AI_API_URL) throw new Error('AI_API_URL is not configured.');

  const payload = {
    model: "TinyLlama-1.1B-Chat-v1.0",
    messages: [
      { role: "system", content: "Analyze the following GitHub comment and classify its intent. Respond with a single word: 'Approved', 'ChangesRequested', or 'Commented'." },
      { role: "user", content: comment }
    ]
  };
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('AI service failed to classify comment.');
  const data = await response.json();
  return data.choices[0]?.message?.content.trim() || 'Commented';
}

/**
 * Sets the status label on a GitHub issue, removing any previous status labels.
 * @param repoFullName The full name of the repository (e.g., "owner/repo").
 * @param issueNumber The number of the issue to update.
 * @param status The new status (e.g., "working", "review", "done").
 */
async function setIssueStatus(repoFullName: string, issueNumber: number, status: string | null) {
  if (!GITHUB_PAT) throw new Error('GITHUB_PAT is not configured.');
  if (!issueNumber) return; // Do nothing if there's no issue number

  const issueUrl = `https://api.github.com/repos/${repoFullName}/issues/${issueNumber}`;
  const labelsUrl = `${issueUrl}/labels`;

  // 1. Fetch current labels
  const issueRes = await fetch(issueUrl, {
    headers: { 'Authorization': `Bearer ${GITHUB_PAT}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!issueRes.ok) {
      console.error(`Failed to fetch issue ${repoFullName}#${issueNumber}`);
      return;
  }
  const issueData = await issueRes.json();
  const currentLabels: { name: string }[] = issueData.labels || [];

  // 2. Filter out old status labels
  const newLabels = currentLabels
    .map(label => label.name)
    .filter(name => !name.startsWith('jules-status:'));

  // 3. Add the new status label if a status is provided
  if (status) {
    newLabels.push(`jules-status:${status}`);
  }

  // 4. Replace the labels on the issue
  await fetch(labelsUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ labels: newLabels }),
  });
}

// --- MAIN WEBHOOK HANDLER ---
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const rawBody = await request.text(); // Get raw body for signature verification

    if (GITHUB_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: 'Signature not found.' }, { status: 401 });
      }

      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
      }
    } else {
        // In a real production app, you should throw an error if the secret is not configured.
        console.warn("GITHUB_WEBHOOK_SECRET is not set. Skipping signature verification. This is insecure.");
    }

    const payload = JSON.parse(rawBody); // Use the body we already read
    const eventType = request.headers.get('x-github-event');
    const { action, repository, issue, pull_request, comment } = payload;
    const repoFullName = repository?.full_name;
    let issueNumber = issue?.number || pull_request?.number;

    // --- Event: Issue Assigned or Closed ---
    if (eventType === 'issues') {
      if (action === 'assigned') {
        await setIssueStatus(repoFullName, issueNumber, 'ready');
        return NextResponse.json({ message: 'Issue assigned, status set to "ready".' });
      }
      if (action === 'closed') {
        await setIssueStatus(repoFullName, issueNumber, 'done');
        return NextResponse.json({ message: 'Issue closed, status set to "done".' });
      }
    }

    // --- Event: Pull Request Opened, Closed, or Merged ---
    if (eventType === 'pull_request') {
      const prBody = pull_request?.body;
      const linkedIssueNumber = parseIssueNumberFromPrBody(prBody);
      if (linkedIssueNumber) {
         if (action === 'opened') {
            await setIssueStatus(repoFullName, linkedIssueNumber, 'working');
            return NextResponse.json({ message: `PR opened, linked issue #${linkedIssueNumber} status set to "working".` });
         }
         if (action === 'closed') {
            const newStatus = pull_request.merged ? 'done' : 'ready';
            await setIssueStatus(repoFullName, linkedIssueNumber, newStatus);
            return NextResponse.json({ message: `PR closed, linked issue #${linkedIssueNumber} status set to "${newStatus}".` });
         }
      }
    }

    // --- Event: Comment on Issue or PR ---
    if ((eventType === 'issue_comment' || eventType === 'pull_request_review_comment') && action === 'created') {
      const commentBody = comment?.body;
      if (!commentBody || !repoFullName || !issueNumber) {
        return NextResponse.json({ message: 'Webhook received, but comment data is missing.' });
      }

      const intent = await getCommentIntent(commentBody);
      let status: string | null = null;
      if (intent === 'Approved') status = 'done';
      if (intent === 'ChangesRequested') status = 'review';

      if (status) {
        const linkedIssueNumber = eventType === 'pull_request_review_comment'
            ? parseIssueNumberFromPrBody(pull_request?.body)
            : issueNumber;

        if (linkedIssueNumber) {
            await setIssueStatus(repoFullName, linkedIssueNumber, status);
            return NextResponse.json({ message: `Comment processed, issue #${linkedIssueNumber} status set to "${status}".` });
        }
      }
    }

    return NextResponse.json({ message: 'Webhook received, but no relevant action was taken.' });

  } catch (error: any) {
    console.error('Error processing webhook:', error.message);
    return NextResponse.json({ error: 'Failed to process webhook.' }, { status: 500 });
  }
}