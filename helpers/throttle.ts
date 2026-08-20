import { ENV } from '../fixtures/env';

const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 4;
const hits: number[] = [];
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForThrottleSlot(): Promise<void> {
  if (!ENV.throttleAware || ENV.runLimitTests) return;
  const now = Date.now();
  while (hits.length > 0 && now - hits[0] >= WINDOW_MS) hits.shift();
  if (hits.length >= MAX_IN_WINDOW) {
    const waitMs = WINDOW_MS - (now - hits[0]) + 500;
    await sleep(waitMs);
  }
  hits.push(Date.now());
}

export function resetThrottleHits(): void {
  hits.length = 0;
}
