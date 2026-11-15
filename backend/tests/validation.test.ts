import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../src/controllers/auth.controller.js';
import { createMonitorSchema } from '../src/controllers/monitor.controller.js';

describe('Validation Schemas Tests', () => {
  it('validates correct user registration inputs', () => {
    const valid = registerSchema.safeParse({
      email: 'engineer@pulsewatch.dev',
      password: 'StrongPassword123!',
      name: 'Test Engineer',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid emails and short passwords', () => {
    const invalid = registerSchema.safeParse({
      email: 'not-an-email',
      password: '123',
      name: 'A',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates correct monitor configuration', () => {
    const valid = createMonitorSchema.safeParse({
      name: 'Production API',
      url: 'https://api.example.com/v1/health',
      method: 'GET',
      intervalSeconds: 60,
      timeoutMs: 5000,
      expectedStatusCode: 200,
    });
    expect(valid.success).toBe(true);
  });

  it('rejects monitor without http protocol in url', () => {
    const invalid = createMonitorSchema.safeParse({
      name: 'Bad URL Monitor',
      url: 'ftp://bad-url.com',
    });
    expect(invalid.success).toBe(false);
  });
});
