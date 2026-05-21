import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RetryOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export async function fetchWithRetry(url: string, config?: AxiosRequestConfig, options?: RetryOptions): Promise<AxiosResponse> {
  const maxRetries = options?.maxRetries ?? 3;
  let backoffMs = options?.initialBackoffMs ?? 1000;
  const maxBackoffMs = options?.maxBackoffMs ?? 10000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if it's a 4xx error (except 429), usually no point in retrying
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }

      console.warn(`[HTTP] Request to ${url} failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
    }
  }
  
  throw new Error('Unreachable code in fetchWithRetry');
}
