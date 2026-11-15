import tls from 'tls';
import { URL } from 'url';

export interface ProbeResult {
  isReachable: boolean;
  statusCode: number;
  responseTimeMs: number;
  certExpiryDays?: number;
  errorMessage?: string;
  keywordMatched?: boolean;
}

export interface ProbeOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  expectedStatusCode?: number;
  keyword?: string;
  sslCheckEnabled?: boolean;
}

/**
 * Checks SSL certificate expiry days for HTTPS domains
 */
async function checkSslExpiry(hostname: string, port = 443, timeoutMs = 5000): Promise<number | undefined> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false, // Probe the cert even if self-signed to calculate expiry
        timeout: timeoutMs,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (cert && cert.valid_to) {
            const validTo = new Date(cert.valid_to).getTime();
            const now = Date.now();
            const diffDays = Math.max(0, Math.floor((validTo - now) / (1000 * 60 * 60 * 24)));
            resolve(diffDays);
            return;
          }
          resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }
    );

    socket.on('error', () => {
      socket.destroy();
      resolve(undefined);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(undefined);
    });
  });
}

/**
 * Probes the target URL and measures latency, HTTP status, SSL cert validity, and keyword matching.
 */
export async function runProbe(options: ProbeOptions): Promise<ProbeResult> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 10000,
    expectedStatusCode = 200,
    keyword,
    sslCheckEnabled = true,
  } = options;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (err: any) {
    return {
      isReachable: false,
      statusCode: 0,
      responseTimeMs: 0,
      errorMessage: `Invalid URL format: ${err.message}`,
    };
  }

  // Check SSL certificate in parallel if HTTPS
  let certExpiryDays: number | undefined;
  if (parsedUrl.protocol === 'https:' && sslCheckEnabled) {
    certExpiryDays = await checkSslExpiry(parsedUrl.hostname, parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443, 4000);
  }

  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'PulseWatch/1.0 (Website & API Uptime Synthetics; +https://pulsewatch.dev)',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
      signal: controller.signal,
      redirect: 'follow',
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const duration = Math.round(performance.now() - start);
    clearTimeout(timeoutId);

    const statusCode = response.status;
    let keywordMatched: boolean | undefined = undefined;

    if (keyword && keyword.trim().length > 0) {
      const responseText = await response.text();
      keywordMatched = responseText.includes(keyword.trim());
    }

    const isStatusOk = statusCode === expectedStatusCode;
    const isKeywordOk = keywordMatched === undefined || keywordMatched === true;
    const isReachable = isStatusOk && isKeywordOk;

    let errorMessage: string | undefined;
    if (!isStatusOk) {
      errorMessage = `Received HTTP status ${statusCode}, expected ${expectedStatusCode}`;
    } else if (keywordMatched === false) {
      errorMessage = `Keyword '${keyword}' was not found in response body`;
    }

    return {
      isReachable,
      statusCode,
      responseTimeMs: duration,
      certExpiryDays,
      errorMessage,
      keywordMatched,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - start);

    let message = err.message || 'Unknown network error';
    if (err.name === 'AbortError' || message.includes('aborted')) {
      message = `Connection timed out after ${timeoutMs}ms`;
    } else if (message.includes('ENOTFOUND')) {
      message = `DNS lookup failed (ENOTFOUND for ${parsedUrl.hostname})`;
    } else if (message.includes('ECONNREFUSED')) {
      message = `Connection refused (ECONNREFUSED)`;
    }

    return {
      isReachable: false,
      statusCode: 0,
      responseTimeMs: duration,
      certExpiryDays,
      errorMessage: message,
    };
  }
}
