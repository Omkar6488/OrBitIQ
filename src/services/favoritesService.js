import { getCachedJson, setCachedJson } from './cacheService';
import { STORAGE_KEYS } from '../utils/constants';

const getStoredMap = async (storageKey) => {
  const cached = await getCachedJson(storageKey);
  return cached && typeof cached === 'object' ? cached : {};
};

const persistMap = (storageKey, map) => setCachedJson(storageKey, map);

export async function getFavoritesMap() {
  return getStoredMap(STORAGE_KEYS.FAVORITE_LAUNCHES);
}

export async function getFavoritesList() {
  const map = await getFavoritesMap();
  return Object.values(map);
}

export async function getFavoriteNewsMap() {
  return getStoredMap(STORAGE_KEYS.FAVORITE_NEWS);
}

export async function getFavoriteNewsList() {
  const map = await getFavoriteNewsMap();
  return Object.values(map);
}

export async function getCombinedFavorites() {
  const [launches, news] = await Promise.all([getFavoritesList(), getFavoriteNewsList()]);
  return { launches, news };
}

export async function isFavoriteLaunch(launchId) {
  const map = await getFavoritesMap();
  return !!map[launchId];
}

export async function toggleFavoriteLaunch(launch) {
  if (!launch?.id) {
    return { favoritesMap: await getFavoritesMap(), isFavorite: false };
  }

  const map = await getStoredMap(STORAGE_KEYS.FAVORITE_LAUNCHES);
  const exists = !!map[launch.id];

  if (exists) {
    delete map[launch.id];
  } else {
    map[launch.id] = launch;
  }

  await persistMap(STORAGE_KEYS.FAVORITE_LAUNCHES, map);

  return {
    favoritesMap: map,
    isFavorite: !exists,
  };
}

export async function toggleFavoriteNews(article) {
  const id = article?.id || article?.url;
  if (!id) {
    return { favoritesMap: await getFavoriteNewsMap(), isFavorite: false };
  }

  const map = await getStoredMap(STORAGE_KEYS.FAVORITE_NEWS);
  const exists = !!map[id];

  if (exists) {
    delete map[id];
  } else {
    map[id] = article;
  }

  await persistMap(STORAGE_KEYS.FAVORITE_NEWS, map);

  return {
    favoritesMap: map,
    isFavorite: !exists,
  };
}
