import { getCachedJson, setCachedJson } from './cacheService';
import { STORAGE_KEYS } from '../utils/constants';

export async function saveRecentItem(item) {
  if (!item?.key) {
    return;
  }

  const existing = (await getCachedJson(STORAGE_KEYS.RECENT_ITEMS)) || [];

  const next = [item, ...existing.filter((entry) => entry.key !== item.key)].slice(0, 30);
  await setCachedJson(STORAGE_KEYS.RECENT_ITEMS, next);
}

export async function getRecentItems() {
  const items = await getCachedJson(STORAGE_KEYS.RECENT_ITEMS);
  return Array.isArray(items) ? items : [];
}
