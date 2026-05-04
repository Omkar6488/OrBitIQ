import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from './config';

export const db = getFirestore(app);

export const addBookmark = (userId, data) => {
  const ref = collection(db, 'users', userId, 'bookmarks');
  return addDoc(ref, data);
};

export const getBookmarks = async (userId) => {
  const ref = collection(db, 'users', userId, 'bookmarks');
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const deleteBookmark = (userId, bookmarkId) => {
  const ref = doc(db, 'users', userId, 'bookmarks', bookmarkId);
  return deleteDoc(ref);
};
