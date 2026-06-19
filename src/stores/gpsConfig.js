import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'gps_api_config';

export const useGpsConfigStore = defineStore('gpsConfig', () => {
  const apiUrl = ref(import.meta.env.VITE_GPS_API_URL || '');
  const apiToken = ref(import.meta.env.VITE_GPS_API_TOKEN || '');

  /**
   * Carga la configuración desde localStorage.
   * Si existe, sobreescribe los valores por defecto del .env.
   * Debe llamarse al iniciar la aplicación.
   */
  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.apiUrl) apiUrl.value = parsed.apiUrl;
      if (parsed.apiToken) apiToken.value = parsed.apiToken;
    } catch {
      // Si el JSON está corrupto o localStorage no está disponible, se ignora.
    }
  };

  /**
   * Persiste la configuración en localStorage y actualiza el store.
   */
  const save = (url, token) => {
    apiUrl.value = url;
    apiToken.value = token;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiUrl: url, apiToken: token }));
    } catch {
      // En entornos sin localStorage (e.g. SSR o modo privado extremo), se ignora.
    }
  };

  return { apiUrl, apiToken, load, save };
});
