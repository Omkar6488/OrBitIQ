import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER: '@orbitiq/user',
  LOGGED_IN: '@orbitiq/is_logged_in',
};

export async function saveUser(user) {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function setLoginStatus(isLoggedIn) {
  await AsyncStorage.setItem(STORAGE_KEYS.LOGGED_IN, JSON.stringify(!!isLoggedIn));
}

export async function getLoginStatus() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOGGED_IN);
  return raw ? JSON.parse(raw) : false;
}

export async function clearLoginStatus() {
  await AsyncStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
}
