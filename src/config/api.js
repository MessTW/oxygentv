export const API_KEY = 'd341436234a2bb8f0adc73114e093ab2';
export const TMDB_BASE_URL = 'https://tmdbapi.rootu.top/3';
export const IMAGE_BASE_URL = 'https://imagetmdb.com/t/p';
export const ALLOHA_BASE_URL = 'https://alloha.as.newplayjj.com:444';
export const ALLOHA_TOKEN = '48ac5259825fb8f0adc73114e093ab2';
export const GOOGLE_API_KEY = 'AIzaSyADMxo6X4JhfiQJjysCk4vctBTfTrTDouc';

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};
