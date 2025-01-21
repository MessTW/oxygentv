/* global gapi */

import { defineStore } from 'pinia'
import { GOOGLE_API_KEY } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/config/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [],
    isLoading: false,
    isInitialized: false
  }),

  actions: {
    async initGoogleDrive(accessToken) {
      if (!accessToken) {
        console.error('No access token provided');
        return;
      }

      try {
        await this.loadGapiClient();
        if (!gapi.client) {
          console.error('Google API client not initialized');
          return;
        }
        gapi.client.setToken({ access_token: accessToken });
        this.isInitialized = true;
        await this.loadFavorites();
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
        this.isInitialized = false;
      }
    },

    async loadGapiClient() {
      if (typeof gapi === 'undefined') {
        console.error('Google API not loaded');
        return;
      }

      try {
        if (!gapi.client) {
          await new Promise((resolve) => {
            gapi.load('client', resolve);
          });
        }

        await gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });

        // Ждем загрузки Drive API
        await new Promise((resolve) => {
          const checkDrive = () => {
            if (gapi.client?.drive?.files) {
              resolve();
            } else {
              setTimeout(checkDrive, 100);
            }
          };
          checkDrive();
        });

        return true;
      } catch (error) {
        console.error('Error initializing Google API client:', error);
        return false;
      }
    },

    async loadFavorites() {
      if (!this.isInitialized) {
        console.warn('Google Drive not initialized');
        return;
      }

      try {
        const isInitialized = await this.loadGapiClient();
        if (!isInitialized) {
          throw new Error('Failed to initialize Google API client');
        }

        const response = await gapi.client.drive.files.list({
          q: "name='favorites.json'",
          spaces: 'appDataFolder',
          fields: 'files(id, name)'
        });

        if (!response || !response.result) {
          console.error('Invalid response from Google Drive API:', response);
          return;
        }

        if (response.result.files.length > 0) {
          const fileId = response.result.files[0].id;
          const file = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
          });
          this.favorites = JSON.parse(file.body);
        } else {
          this.favorites = [];
          await this.saveFavorites(this.favorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        this.favorites = [];
      }
    },

    async saveFavorites(favorites) {
      if (!this.isInitialized) {
        console.warn('Google Drive not initialized');
        return;
      }

      try {
        const fileMetadata = {
          name: 'favorites.json',
          parents: ['appDataFolder']
        };

        const content = JSON.stringify(favorites);
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelim = "\r\n--" + boundary + "--";

        const contentType = 'application/json';
        const metadata = JSON.stringify(fileMetadata);

        const response = await gapi.client.drive.files.list({
          q: "name='favorites.json'",
          spaces: 'appDataFolder',
          fields: 'files(id)'
        });

        if (response.result.files.length > 0) {
          const fileId = response.result.files[0].id;
          await gapi.client.request({
            path: '/upload/drive/v3/files/' + fileId,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: content,
            headers: {
              'Content-Type': contentType
            }
          });
        } else {
          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            metadata +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            content +
            closeDelim;

          await gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: {
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            body: multipartRequestBody
          });
        }
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    },

    async toggleFavorite(item) {
      if (!this.isInitialized) {
        try {
          const authStore = useAuthStore();
          if (authStore.accessToken) {
            await this.initGoogleDrive(authStore.accessToken);
          } else {
            console.warn('Cannot toggle favorite: No access token');
            return;
          }
        } catch (error) {
          console.error('Failed to initialize Google Drive:', error);
          return;
        }
      }

      if (!this.isInitialized) {
        console.warn('Still cannot toggle favorite: Google Drive initialization failed');
        return;
      }

      const index = this.favorites.findIndex(f => f.id === item.id);
      let newFavorites = [...this.favorites];

      if (index === -1) {
        newFavorites.push(item);
      } else {
        newFavorites.splice(index, 1);
      }

      // Обновляем состояние до сохранения для мгновенной реакции UI
      this.favorites = newFavorites;

      // Сохраняем изменения
      await this.saveFavorites(newFavorites);
    },

    async clearFavorites() {
      try {
        this.favorites = [];
        await this.saveFavorites([]);
        // Обновляем информацию в Firestore
        const authStore = useAuthStore();
        if (authStore.user) {
          const userRef = doc(db, 'users', authStore.user.uid);
          await updateDoc(userRef, {
            'storage.lastSync': serverTimestamp(),
            'storage.lastClear': serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error clearing favorites:', error);
      }
    },

    async deleteGoogleDriveFile() {
      if (!this.isInitialized) {
        console.warn('Google Drive not initialized');
        return;
      }

      try {
        const response = await gapi.client.drive.files.list({
          q: "name='favorites.json'",
          spaces: 'appDataFolder',
          fields: 'files(id)'
        });

        if (response.result.files.length > 0) {
          const fileId = response.result.files[0].id;
          await gapi.client.drive.files.delete({
            fileId: fileId
          });
        }
      } catch (error) {
        console.error('Error deleting Google Drive file:', error);
      }
    }
  }
})
