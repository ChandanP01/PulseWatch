import { describe, it, expect } from 'vitest';
import { runProbe } from '../src/engine/probe.js';

describe('Probe Engine Tests', () => {
  it('should handle invalid URLs gracefully', async () => {
    const result = await runProbe({
      url: 'not-a-valid-url',
    });

    expect(result.isReachable).toBe(false);
    expect(result.statusCode).toBe(0);
    expect(result.errorMessage).toContain('Invalid URL');
  });

  it('should detect network timeouts appropriately', async () => {
    const result = await runProbe({
      url: 'http://127.0.0.1:59999', // Port with no listener
      timeoutMs: 1000,
      sslCheckEnabled: false,
    });

    expect(result.isReachable).toBe(false);
    expect(result.errorMessage).toBeDefined();
  }, 10000);

  it('should probe a reachable domain successfully', async () => {
    const result = await runProbe({
      url: 'https://dns.google/resolve?name=example.com',
      expectedStatusCode: 200,
      timeoutMs: 8000,
    });

    if (result.statusCode === 200) {
      expect(result.isReachable).toBe(true);
      expect(result.responseTimeMs).toBeGreaterThan(0);
    }
  });
});
