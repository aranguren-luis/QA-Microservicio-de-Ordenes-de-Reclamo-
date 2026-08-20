import { expect, type APIResponse } from '@playwright/test';

interface Detail { field?: string; message: string; }
interface ErrorBody { data: null; error: { code: string; message: string; traceId: string; details?: Detail[] }; meta: null; }
interface OkBody<T> { data: T; error: null; meta: null; }

export const SUCCESS_DATA = { message: 'Order creation process initiated', status: 'queued' };
export const TRACE_ID_PATTERN = /^trc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function readJson(response: APIResponse): Promise<unknown> {
  return (await response.json()) as unknown;
}

export async function expectStatus(response: APIResponse, expected: number): Promise<void> {
  if (response.status() !== expected) {
    let body = '<sin body legible>';
    try { body = await response.text(); } catch {}
    expect(response.status(), `esperado ${expected}, recibido ${response.status()} -- body: ${body.slice(0, 800)}`).toBe(expected);
  }
}

async function envelopeOf(response: APIResponse): Promise<{ data: unknown; error: unknown; meta: unknown }> {
  const body = (await readJson(response)) as { data: unknown; error: unknown; meta: unknown };
  expect(Object.keys(body).sort()).toEqual(['data', 'error', 'meta']);
  expect(body.meta).toBeNull();
  return body;
}

export async function expectClientError(response: APIResponse): Promise<void> {
  const status = response.status();
  if (status < 400 || status >= 500) {
    let body = '<sin body legible>';
    try { body = await response.text(); } catch {}
    expect(status >= 400 && status < 500, `esperado 4xx, recibido ${status}`).toBe(true);
  }
}

export async function expectOk(response: APIResponse): Promise<void> {
  await expectStatus(response, 201);
  const { data, error } = await envelopeOf(response);
  expect(error).toBeNull();
  expect(data).toEqual(SUCCESS_DATA);
}

export async function expectValidationError(response: APIResponse, expectedDetails: Detail[]): Promise<void> {
  await expectStatus(response, 422);
  const { data, error } = await envelopeOf(response);
  expect(data).toBeNull();
  const err = error as ErrorBody['error'];
  expect(err.code).toBe('VALIDATION_ERROR');
  expect(err.message).toBe('The request contains invalid fields.');
  expect(err.traceId).toMatch(TRACE_ID_PATTERN);
  expect(sortDetails(err.details ?? [])).toEqual(sortDetails(expectedDetails));
}

export async function expectUnauthorized(response: APIResponse): Promise<void> {
  await expectStatus(response, 401);
  const { data, error } = await envelopeOf(response);
  expect(data).toBeNull();
  const err = error as ErrorBody['error'];
  expect(err.code).toBe('UNAUTHORIZED');
  expect(err.message).toBe('Invalid or expired token');
  expect(err.traceId).toMatch(TRACE_ID_PATTERN);
}

export async function expectUnauthorizedMessage(response: APIResponse): Promise<void> {
  await expectStatus(response, 401);
  expect(await readJson(response)).toEqual({ message: 'Missing JWT token in request' });
}

export async function expectBadRequest(response: APIResponse): Promise<void> {
  await expectStatus(response, 400);
  let body: unknown;
  try { body = await readJson(response); } catch { return; }
  const { data } = body as { data?: unknown };
  expect(data, 'no debe ser el envelope de exito').toBeFalsy();
}

export async function expectRateLimited(response: APIResponse): Promise<void> {
  await expectStatus(response, 429);
  const { data, error } = await envelopeOf(response);
  expect(data).toBeNull();
  const err = error as ErrorBody['error'];
  expect(err.code).toBe('RATE_LIMITED');
  expect(err.message).toBe('Too many requests');
}

export async function expectQuotaExceeded(response: APIResponse): Promise<void> {
  await expectStatus(response, 429);
  const { data, error } = await envelopeOf(response);
  expect(data).toBeNull();
  const err = error as ErrorBody['error'];
  expect(err.code).toBe('QUOTA_EXCEEDED');
  expect(err.message).toMatch(/^Daily quota of \d+ requests exceeded$/);
}

export async function expectNotFound(response: APIResponse): Promise<void> {
  await expectStatus(response, 404);
  let body: unknown;
  try { body = await readJson(response); } catch { return; }
  const { data } = body as { data?: unknown };
  expect(data, 'no debe ser el envelope de exito').toBeFalsy();
}

export async function expectForbidden(response: APIResponse): Promise<void> {
  await expectStatus(response, 403);
  let body: unknown;
  try { body = await readJson(response); } catch { return; }
  const { data } = body as { data?: unknown };
  expect(data, 'no debe ser el envelope de exito').toBeFalsy();
}

function sortDetails(details: Detail[]): Detail[] {
  return [...details].sort((a, b) => `${a.field ?? ''}|${a.message}`.localeCompare(`${b.field ?? ''}|${b.message}`));
}

export type { ErrorBody as ErrorEnvelope, OkBody as OkEnvelope };
