export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "HttpError";
  }
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
