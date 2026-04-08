import { createHmac } from 'node:crypto';

import { jest } from '@jest/globals';

import {
  resetWebhookFetchForTests,
  sendWebhook,
  setWebhookFetchForTests
} from '../../src/webhooks.js';

describe('webhooks', () => {
  beforeEach(() => {
    resetWebhookFetchForTests();
  });

  afterEach(() => {
    resetWebhookFetchForTests();
  });

  it('sends a JSON webhook without a signature when no secret is configured', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 202,
      statusText: 'Accepted'
    }));

    setWebhookFetchForTests(fetchMock as unknown as typeof fetch);

    await sendWebhook(
      {
        url: 'https://hooks.example/events',
        events: ['alert']
      },
      { status: 'down', server: 'alpha' }
    );

    expect(fetchMock).toHaveBeenCalledWith('https://hooks.example/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"status":"down","server":"alpha"}'
    });
  });

  it('signs the payload with HMAC-SHA256 when a secret is configured', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK'
    }));
    const payload = { message: 'server down', server: 'beta' };
    const body = JSON.stringify(payload);
    const signature = `sha256=${createHmac('sha256', 'super-secret').update(body).digest('hex')}`;

    setWebhookFetchForTests(fetchMock as unknown as typeof fetch);

    await sendWebhook(
      {
        url: 'https://hooks.example/signed',
        secret: 'super-secret',
        events: ['down']
      },
      payload
    );

    expect(fetchMock).toHaveBeenCalledWith('https://hooks.example/signed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-Signature-256': signature
      },
      body
    });
  });

  it('throws when the webhook endpoint rejects the request', async () => {
    setWebhookFetchForTests(
      (async () =>
        ({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        }) as Response) as typeof fetch
    );

    await expect(
      sendWebhook(
        {
          url: 'https://hooks.example/fail',
          events: ['alert']
        },
        { status: 'error' }
      )
    ).rejects.toThrow('Webhook failed: 500 Internal Server Error');
  });
});
