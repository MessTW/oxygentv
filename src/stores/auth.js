import { defineStore } from 'pinia';
import { auth, provider } from '@/config/firebase';
import { db } from '@/config/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFavoritesStore } from './favorites';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    isInitialized: false,
    accessToken: localStorage.getItem('google_access_token')
  }),

  actions: {
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.loading = true;
          if (user) {
            this.user = user;
            await this.saveUserToFirestore(user);
            // Инициализируем Google Drive только если есть токен
            if (this.accessToken) {
              const favoritesStore = useFavoritesStore();
              await favoritesStore.initGoogleDrive(this.accessToken);
            }
          } else {
            this.user = null;
            this.accessToken = null;
          }
          this.loading = false;
          this.isInitialized = true;
          resolve(user);
        });
      });
    },

    async register(email, password) {
      try {
        this.loading = true;
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        this.user = user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      try {
        this.loading = true;
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        this.user = user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.accessToken = null;
        localStorage.removeItem('google_access_token');
        return true;
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    },

    async saveUserToFirestore(user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
          storage: {
            type: 'google_drive',
            description: 'Избранное хранится в Google Drive (appDataFolder)',
            canDelete: true,
            lastSync: serverTimestamp()
          }
        }, { merge: true });
      } catch (error) {
        console.error('Error saving user to Firestore:', error);
      }
    },

    async signInWithGoogle() {
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        await this.saveUserToFirestore(result.user);
        if (credential?.accessToken) {
          this.accessToken = credential.accessToken;
          localStorage.setItem('google_access_token', credential.accessToken);
          const favoritesStore = useFavoritesStore();
          await favoritesStore.initGoogleDrive(credential.accessToken);
        }
        return result;
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    },

    enableDemoMode() {
      this.demoMode = true;
      this.isInitialized = true;
    },

    disableDemoMode() {
      this.demoMode = false;
    },

    isDemoRestricted(route) {
      if (!this.demoMode) return false;
      const allowedRoutes = ['home'];
      return !allowedRoutes.includes(route.name);
    },

    async deleteAccount() {
      try {
        if (!this.user) return;

        // Очищаем избранное в Google Drive
        const favoritesStore = useFavoritesStore();
        if (favoritesStore.isInitialized) {
          await favoritesStore.clearFavorites();
          // Удаляем файл favorites.json
          await favoritesStore.deleteGoogleDriveFile();
        }

        // Удаляем пользователя из Firestore
        const userRef = doc(db, 'users', this.user.uid);
        await deleteDoc(userRef);

        // Удаляем пользователя из Firebase Auth
        await this.user.delete();

        // Очищаем локальное состояние
        this.user = null;
        this.accessToken = null;
        localStorage.removeItem('google_access_token');

        return true;
      } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
    }
  }
});
