export const ENV = {
  keycloakAuthServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URL ?? 'https://kms.qa.mock.com',
  keycloakRealm: process.env.KEYCLOAK_REALM ?? 'mock-realm',
  keycloakClientId: process.env.KEYCLOAK_CLIENT_ID ?? 'ordenes-reclamo',
  keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '<PLACEHOLDER>',
  runLimitTests: process.env.RUN_LIMIT_TESTS === '1',
  throttleAware: process.env.THROTTLE_AWARE !== 'false',
} as const;

export const tokenUrl = (): string =>
  `${ENV.keycloakAuthServerUrl}/realms/${ENV.keycloakRealm}/protocol/openid-connect/token`;
