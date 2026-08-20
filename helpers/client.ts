import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { waitForThrottleSlot } from './throttle';
import { getBearerToken } from '../fixtures/auth';

export interface PostOptions {
  idempotencyKey?: string;
  authHeader?: string;
  skipAuth?: boolean;
}

export async function apiPost(
  request: APIRequestContext,
  url: string,
  body: unknown,
  options: PostOptions = {},
): Promise<APIResponse> {
  await waitForThrottleSlot();
  const headers: Record<string, string> = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.authHeader) {
    headers.Authorization = options.authHeader;
  } else if (!options.skipAuth) {
    const token = await getBearerToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return request.post(url, { data: body, headers });
}
