import { ENV, tokenUrl } from './env';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function requestToken(clientId: string, clientSecret: string): Promise<{ accessToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(`Token request failed: HTTP ${response.status}`);
  }
  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error('Token response did not include access_token');
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 300 };
}

export async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  const { accessToken, expiresIn } = await requestToken(ENV.keycloakClientId, ENV.keycloakClientSecret);
  cachedToken = {
    value: accessToken,
    expiresAt: Date.now() + Math.max(expiresIn - 30, 60) * 1000,
  };
  return accessToken;
}
