export const COMPANIES = {
  DO: process.env.COMPANY_ID_DO ?? '11111111-1111-1111-1111-111111111111',
  PE: process.env.COMPANY_ID_PE ?? '22222222-2222-2222-2222-222222222222',
  VE: process.env.COMPANY_ID_VE ?? '33333333-3333-3333-3333-333333333333',
  UNKNOWN: process.env.COMPANY_ID_UNKNOWN ?? '00000000-0000-0000-0000-000000000000',
} as const;

export const ordersUrl = (companyId: string): string =>
  `/v2/companies/${companyId}/orders`;
