import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { POST } from './route.js';
import { globalWebhookDeliveryStore } from '@noctara/github';

describe('POST /api/webhooks/github HTTP Route Handler', () => {
  const secret = 'webhook-test-secret-abcdef';

  beforeEach(() => {
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    globalWebhookDeliveryStore.clear();
  });

  const sign = (body: string, key = secret) => {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(body, 'utf8');
    return `sha256=${hmac.digest('hex')}`;
  };

  it('rejects requests with missing signature (401)', async () => {
    const body = JSON.stringify({ zen: 'test' });
    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-github-event': 'ping',
        'x-github-delivery': 'del-001'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Unauthorized');
  });

  it('rejects requests with invalid signature (401)', async () => {
    const body = JSON.stringify({ zen: 'test' });
    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': 'sha256=invalidhash0000000000000000000000000000000000000000000000000000',
        'x-github-event': 'ping',
        'x-github-delivery': 'del-002'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests when GITHUB_WEBHOOK_SECRET is unset (500)', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const body = JSON.stringify({ zen: 'test' });
    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': sign(body),
        'x-github-event': 'ping',
        'x-github-delivery': 'del-003'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('successfully processes valid signed ping event (200)', async () => {
    const body = JSON.stringify({ zen: 'Responsive is better than fast.', hook_id: 12345 });
    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': sign(body),
        'x-github-event': 'ping',
        'x-github-delivery': 'del-ping-100'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe('pong');
    expect(json.zen).toBe('Responsive is better than fast.');
  });

  it('handles duplicate delivery idempotently (200 already_processed)', async () => {
    const body = JSON.stringify({ zen: 'test' });
    const deliveryId = 'del-idempotent-200';

    const req1 = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': sign(body),
        'x-github-event': 'ping',
        'x-github-delivery': deliveryId
      },
      body
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    const req2 = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': sign(body),
        'x-github-event': 'ping',
        'x-github-delivery': deliveryId
      },
      body
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.status).toBe('already_processed');
    expect(json2.deliveryId).toBe(deliveryId);
  });

  it('processes pull_request opened event and records delivery', async () => {
    const prPayload = {
      action: 'opened',
      pull_request: {
        number: 7,
        title: 'Add security boundary checks',
        head: { ref: 'sec-patch' },
        base: { ref: 'main' }
      },
      repository: { full_name: 'noctara-org/noctara' },
      sender: { login: 'dev-bob' }
    };
    const body = JSON.stringify(prPayload);

    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': sign(body),
        'x-github-event': 'pull_request',
        'x-github-delivery': 'del-pr-7'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.event).toBe('pull_request');
    expect(json.prNumber).toBe(7);
  });
});

