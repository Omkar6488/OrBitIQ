import { ENDPOINTS } from './endpoints';
import { createApiClient, withRetry } from './client';
import {
  APOD_PLACEHOLDER,
  API_RETRY_ATTEMPTS,
  LIST_LIMIT,
  STORAGE_KEYS,
} from '../utils/constants';
import { getCachedJson, setCachedJson } from '../services/cacheService';

const launchApi = createApiClient('https://ll.thespacedevs.com/2.2.0');
const newsApi = createApiClient('https://api.spaceflightnewsapi.net/v4');
const nasaApi = createApiClient('https://api.nasa.gov');
const issApi = createApiClient('http://api.open-notify.org');

const requestWithRetry = async (requester, attempts = API_RETRY_ATTEMPTS) => {
  const response = await withRetry(requester, attempts);
  return response.data;
};

export const getUpcomingLaunches = (params = { limit: LIST_LIMIT }) =>
  requestWithRetry(() => launchApi.get(ENDPOINTS.UPCOMING_LAUNCHES, { params }));

export const getPreviousLaunches = (params = { limit: LIST_LIMIT }) =>
  requestWithRetry(() => launchApi.get(ENDPOINTS.PREVIOUS_LAUNCHES, { params }));

export const getSpaceNews = (params = { limit: LIST_LIMIT, ordering: '-published_at' }) =>
  requestWithRetry(() => newsApi.get(ENDPOINTS.SPACE_NEWS, { params }));

export const getNasaApod = async (params = { api_key: 'DEMO_KEY' }) => {
  try {
    const mergedParams = {
      api_key: 'DEMO_KEY',
      thumbs: true,
      ...params,
    };
    const data = await requestWithRetry(() => nasaApi.get(ENDPOINTS.NASA_APOD, { params: mergedParams }));
    await setCachedJson(STORAGE_KEYS.APOD_CACHE, data);
    return { ...data, __source: 'network' };
  } catch (error) {
    const cached = await getCachedJson(STORAGE_KEYS.APOD_CACHE);
    if (cached) {
      return { ...cached, __source: 'cache' };
    }

    return { ...APOD_PLACEHOLDER, __source: 'placeholder' };
  }
};

export const getIssNow = () =>
  requestWithRetry(() => issApi.get(ENDPOINTS.ISS_NOW));
