import axios from 'axios';
import { API_TIMEOUT } from '../utils/constants';

export function createApiClient(baseURL) {
  const client = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Network request failed';

      return Promise.reject({
        message,
        status: error?.response?.status,
        isTimeout: error?.code === 'ECONNABORTED',
      });
    }
  );

  return client;
}

export async function withRetry(requestFn, attempts = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
