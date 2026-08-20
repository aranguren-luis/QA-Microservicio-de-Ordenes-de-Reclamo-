import { expect, test } from '@playwright/test';
import { COMPANIES, ordersUrl } from '../fixtures/companies';
import { PAYLOADS, VALID_PAYLOAD } from '../fixtures/payloads';
import { apiPost } from '../helpers/client';
import { expectBadRequest, expectClientError, expectForbidden, expectNotFound, expectOk, expectUnauthorizedMessage, expectValidationError, readJson } from '../helpers/envelope';
import { newKey } from '../helpers/idempotency';
import { resetThrottleHits } from '../helpers/throttle';

test.beforeAll(() => { resetThrottleHits(); });

test.describe('2.1 Auth / Headers (TC-001..TC-006)', () => {
  test('TC-001 POST valido con Bearer valido -> 201 queued', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: newKey('tc001') });
    await expectOk(res);
  });
  test('TC-002 Sin Authorization -> 401 + body {message}', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: newKey('tc002'), skipAuth: true });
    await expectUnauthorizedMessage(res);
  });
  test('TC-003 Bearer invalido/revocado -> 400', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: newKey('tc003'), authHeader: 'Bearer token-inactivo-falso' });
    await expectBadRequest(res);
  });
  test('TC-004 Bearer vacio -> 400', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: newKey('tc004'), authHeader: 'Bearer   ' });
    await expectBadRequest(res);
  });
  test('TC-005 Bearer malformado -> 400', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: newKey('tc005'), authHeader: 'token-sin-prefijo' });
    await expectBadRequest(res);
  });
  test('TC-006 Sin Idempotency-Key -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, {});
    await expectValidationError(res, [{ message: 'Idempotency-Key header is required' }]);
  });
});

test.describe('2.2 Validacion DTO (TC-008..TC-015b)', () => {
  test('TC-008 orderDetailId faltante -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.missingOrderDetailId, { idempotencyKey: newKey('tc008') });
    await expectValidationError(res, [{ field: 'orderDetailId', message: 'orderDetailId must be a string' }, { field: 'orderDetailId', message: 'orderDetailId should not be empty' }]);
  });
  test('TC-009 orderDetailId numerico -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.numericOrderDetailId, { idempotencyKey: newKey('tc009') });
    await expectValidationError(res, [{ field: 'orderDetailId', message: 'orderDetailId must be a string' }]);
  });
  test('TC-010 Propiedad extra -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.extraField, { idempotencyKey: newKey('tc010') });
    await expectValidationError(res, [{ field: 'property', message: 'property extraField should not exist' }]);
  });
  test('TC-011 nationalId vacio -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.emptyNationalId, { idempotencyKey: newKey('tc011') });
    await expectValidationError(res, [{ field: 'nationalId', message: 'nationalId debe contener solo numeros' }, { field: 'nationalId', message: 'nationalId should not be empty' }]);
  });
  test('TC-012 Body vacio -> 422 con 9 details', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.empty, { idempotencyKey: newKey('tc012') });
    await expectValidationError(res, [
      { field: 'orderDetailId', message: 'orderDetailId must be a string' },
      { field: 'orderDetailId', message: 'orderDetailId should not be empty' },
      { field: 'orderDetails', message: 'orderDetails must be a string' },
      { field: 'orderDetails', message: 'orderDetails should not be empty' },
      { field: 'contractId', message: 'contractId must be a string' },
      { field: 'contractId', message: 'contractId should not be empty' },
      { field: 'nationalId', message: 'nationalId debe contener solo numeros' },
      { field: 'nationalId', message: 'nationalId must be a string' },
      { field: 'nationalId', message: 'nationalId should not be empty' },
    ]);
  });
  test('TC-013 Body >100KB -> 4xx limpio', async ({ request }) => {
    const a = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.longBothFields, { idempotencyKey: newKey('tc013a') });
    await expectOk(a);
    const c = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.oversizeBodyBothFields, { idempotencyKey: newKey('tc013c') });
    await expectClientError(c);
  });
  test('TC-014 Unicode en orderDetails -> 201', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.unicodeOrderDetails, { idempotencyKey: newKey('tc014') });
    await expectOk(res);
  });
  test('TC-015a nationalId con guion -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.nationalIdWithHyphen, { idempotencyKey: newKey('tc015a') });
    await expectValidationError(res, [{ field: 'nationalId', message: 'nationalId debe contener solo numeros' }]);
  });
  test('TC-015b nationalId con letras -> 422', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO), PAYLOADS.nationalIdWithLetters, { idempotencyKey: newKey('tc015b') });
    await expectValidationError(res, [{ field: 'nationalId', message: 'nationalId debe contener solo numeros' }]);
  });
});

test.describe('2.3 CompanyValidationPipe (TC-015..TC-019)', () => {
  test('TC-015 companyId = region code -> 404', async ({ request }) => {
    const res = await apiPost(request, ordersUrl('do'), VALID_PAYLOAD, { idempotencyKey: newKey('tc015') });
    await expectNotFound(res);
  });
  test('TC-016 companyId UUID no registrado -> 404', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.UNKNOWN), VALID_PAYLOAD, { idempotencyKey: newKey('tc016') });
    await expectNotFound(res);
  });
  test('TC-017 companyId no-UUID -> 404', async ({ request }) => {
    const res = await apiPost(request, ordersUrl('xyz'), VALID_PAYLOAD, { idempotencyKey: newKey('tc017') });
    await expectNotFound(res);
  });
  test('TC-018 companyId UUID en MAYUSCULAS -> 404', async ({ request }) => {
    const res = await apiPost(request, ordersUrl(COMPANIES.DO.toUpperCase()), VALID_PAYLOAD, { idempotencyKey: newKey('tc018') });
    await expectNotFound(res);
  });
  test('TC-019 companyId path traversal -> 403', async ({ request }) => {
    const res = await apiPost(request, ordersUrl('../../etc/passwd'), VALID_PAYLOAD, { idempotencyKey: newKey('tc019') });
    await expectForbidden(res);
  });
});

test.describe('2.4 Idempotencia HTTP (TC-020..TC-023)', () => {
  test('TC-020 Misma key dos veces -> cache', async ({ request }) => {
    const key = newKey('tc020');
    const url = ordersUrl(COMPANIES.DO);
    const first = await apiPost(request, url, VALID_PAYLOAD, { idempotencyKey: key });
    await expectOk(first);
    const second = await apiPost(request, url, VALID_PAYLOAD, { idempotencyKey: key });
    expect(second.status()).toBe(201);
    expect(await readJson(second)).toEqual(await readJson(first));
  });
  test('TC-021 Misma key en empresas distintas -> independientes', async ({ request }) => {
    const key = newKey('tc021');
    const a = await apiPost(request, ordersUrl(COMPANIES.DO), VALID_PAYLOAD, { idempotencyKey: key });
    await expectOk(a);
    const b = await apiPost(request, ordersUrl(COMPANIES.PE), VALID_PAYLOAD, { idempotencyKey: key });
    await expectOk(b);
  });
  test('TC-022 Idempotency-Key de 200+ chars -> 201', async ({ request }) => {
    const res = await apiP
