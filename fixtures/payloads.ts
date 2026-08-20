export const VALID_PAYLOAD = {
  orderDetailId: 'ORD-1001',
  orderDetails: 'Mantenimiento de servicio',
  contractId: 'CONT-9988',
  nationalId: '12345678',
};

export const PAYLOADS = {
  missingOrderDetailId: {
    orderDetails: VALID_PAYLOAD.orderDetails,
    contractId: VALID_PAYLOAD.contractId,
    nationalId: VALID_PAYLOAD.nationalId,
  },
  numericOrderDetailId: { ...VALID_PAYLOAD, orderDetailId: 123 },
  extraField: { ...VALID_PAYLOAD, extraField: 'x' },
  emptyNationalId: { ...VALID_PAYLOAD, nationalId: '' },
  empty: {},
  longBothFields: { ...VALID_PAYLOAD, orderDetails: 'x'.repeat(5000), orderDetailId: 'x'.repeat(5000) },
  oversizeBodyBothFields: { ...VALID_PAYLOAD, orderDetails: 'x'.repeat(60000), orderDetailId: 'x'.repeat(60000) },
  unicodeOrderDetails: { ...VALID_PAYLOAD, orderDetails: 'Mantenimiento de servicio unicode test' },
  nationalIdWithHyphen: { ...VALID_PAYLOAD, nationalId: 'V-12345678' },
  nationalIdWithLetters: { ...VALID_PAYLOAD, nationalId: 'ABC12345' },
} as const;
