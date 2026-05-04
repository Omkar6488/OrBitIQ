import {
	getAuth,
	initializeAuth,
	getReactNativePersistence,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithCredential,
	GoogleAuthProvider,
	signOut,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './config';

let authInstance;

try {
	authInstance = initializeAuth(app, {
		persistence: getReactNativePersistence(AsyncStorage),
	});
} catch (error) {
	authInstance = getAuth(app);
}

export const auth = authInstance;

export const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const loginWithGoogleIdToken = (idToken) => {
	const credential = GoogleAuthProvider.credential(idToken);
	return signInWithCredential(auth, credential);
};

export const logout = () => signOut(auth);
