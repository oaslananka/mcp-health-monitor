export interface RetryOptions {
  attempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  shouldRetry: (error: unknown) => boolean;
}

const DEFAULT_RETRY: RetryOptions = {
  attempts: 2,
  initialDelayMs: 200,
  maxDelayMs: 1000,
  factor: 2,
  shouldRetry: () => true
};

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;
  let delayMs = config.initialDelayMs;

  for (let attempt = 0; attempt < config.attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= config.attempts - 1 || !config.shouldRetry(error)) {
        throw error;
      }

      await sleep(delayMs);
      delayMs = Math.min(delayMs * config.factor, config.maxDelayMs);
    }
  }

  throw lastError;
}
