export interface ProviderStatus {
  providerName: string;
  connected: boolean;
  status: 'connected' | 'not-configured' | 'failed' | 'rate-limited' | 'no-results';
  message: string;
  lastCheckedAt: string;
}

export function makeNotConfiguredStatus(providerName: string): ProviderStatus {
  return {
    providerName,
    connected: false,
    status: 'not-configured',
    message: `${providerName} is not configured. Add required environment variables to enable.`,
    lastCheckedAt: new Date().toISOString(),
  };
}

export function makeFailedStatus(providerName: string, message: string): ProviderStatus {
  return {
    providerName,
    connected: false,
    status: 'failed',
    message,
    lastCheckedAt: new Date().toISOString(),
  };
}

export function makeNoResultsStatus(providerName: string): ProviderStatus {
  return {
    providerName,
    connected: true,
    status: 'no-results',
    message: `${providerName} returned no results.`,
    lastCheckedAt: new Date().toISOString(),
  };
}

export function makeConnectedStatus(providerName: string, message?: string): ProviderStatus {
  return {
    providerName,
    connected: true,
    status: 'connected',
    message: message ?? `${providerName} returned results.`,
    lastCheckedAt: new Date().toISOString(),
  };
}
