export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class TimeoutError extends Error {
  constructor(label: string) {
    super(`Timed out: ${label}`);
    this.name = "TimeoutError";
  }
}

/**
 * Bounds any promise (DB calls included) to a max duration. Serverless
 * Postgres connections (Neon) can occasionally go stale and leave a query
 * awaiting a response that never arrives — with no timeout, one bad
 * connection in a long-running loop (e.g. nationwide dealer discovery) can
 * silently hang the entire job for hours. This guarantees forward progress:
 * the stuck operation is abandoned (not cancelled — just no longer awaited)
 * and the caller treats it as a failure instead of hanging with it.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: { retries?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const retries = options.retries ?? 4;
  const timeoutMs = options.timeoutMs ?? 20_000;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      if (response.ok || !RETRYABLE.has(response.status) || attempt === retries) {
        return response;
      }
      lastError = new HttpError(
        `HTTP ${response.status} for ${url}`,
        response.status
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === retries) throw lastError;
    } finally {
      clearTimeout(timer);
    }

    await sleep(500 * 2 ** attempt);
  }

  throw lastError ?? new Error(`Request failed: ${url}`);
}
