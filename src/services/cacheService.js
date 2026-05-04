import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCachedJson(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export async function setCachedJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Cache writes are intentionally best-effort.
  }
}

export async function removeCachedJson(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // Cache removals are intentionally best-effort.
  }
}
