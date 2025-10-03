import { POST } from '@/app/api/webhooks/github/route';
import * as crypto from 'crypto';

describe('GitHub Webhook Handler', () => {
  const secret = 'my-super-secret-webhook-secret';
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      GITHUB_WEBHOOK_SECRET: secret,
      AI_API_URL: 'http://test.com', // Mock other required env vars
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  const createMockRequest = (payload: any, signature?: string): Request => {
    const body = JSON.stringify(payload);
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-github-event': 'ping',
    });
    if (signature) {
      headers.set('x-hub-signature-256', signature);
    }
    return new Request('http://localhost/api/webhooks/github', {
      method: 'POST',
      headers,
      body,
    });
  };

  it('should return 401 if signature is missing', async () => {
    const payload = { zen: 'Hello, World!' };
    const request = createMockRequest(payload); // No signature
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Signature not found.');
  });

  it('should return 401 if signature is invalid', async () => {
    const payload = { zen: 'Hello, World!' };
    const request = createMockRequest(payload, 'sha256=invalid-signature');
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid signature.');
  });

  it('should process the webhook if the signature is valid', async () => {
    const payload = { zen: 'Hello, World!' };
    const bodyString = JSON.stringify(payload);
    const validSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex')}`;

    const request = createMockRequest(payload, validSignature);
    const response = await POST(request);

    // We expect a 200 OK, but with a message that no action was taken for a 'ping' event
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain('Webhook received, but no relevant action was taken.');
  });

  it('should skip verification if secret is not configured', async () => {
    // Unset the secret for this test
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const payload = { zen: 'Hello, World!' };
    const request = createMockRequest(payload); // No signature
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(consoleWarnSpy).toHaveBeenCalledWith("GITHUB_WEBHOOK_SECRET is not set. Skipping signature verification. This is insecure.");

    consoleWarnSpy.mockRestore();
  });
});