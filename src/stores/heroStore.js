import { ref } from 'vue'
import { defineStore } from 'pinia'

const API_KEY = 'd341436234a2bb8f0adc73114e093ab2'
const BASE_URL = 'https://apitmdb.cub.red/3'

export const useHeroStore = defineStore('hero', () => {
  const trendingItems = ref([])
  const isLoading = ref(false)

  const fetchTrending = async () => {
    isLoading.value = true
    try {
      const response = await fetch(
        `${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ru`
      )
      const data = await response.json()
      trendingItems.value = await Promise.all(
        data.results.map(async item => {
          const detailsResponse = await fetch(
            `${BASE_URL}/${item.media_type}/${item.id}?api_key=${API_KEY}&language=ru&append_to_response=images&include_image_language=ru,en,null&credits,external_ids,videos,watch/providers,networks,production_companies`
          )
          const details = await detailsResponse.json()
          return {
            ...details,
            media_type: item.media_type,
            title: item.media_type === 'movie' ? details.title : details.name,
            release_date: item.media_type === 'movie' ? details.release_date : details.first_air_date,
            name: item.media_type === 'tv' ? details.name : details.title,
            first_air_date: item.media_type === 'tv' ? details.first_air_date : details.release_date,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            id: details.id
          }
        })
      )

      // Фильтруем только контент с русскими названиями
      trendingItems.value = trendingItems.value
        .filter(item => {
          const hasRussianChars = /[а-яА-ЯёЁ]/.test(item.title || item.name);
          const hasNoLatinChars = !/[a-zA-Z]/.test(item.title || item.name);
          return hasRussianChars && hasNoLatinChars;
        })
        // Добавляем случайную сортировку
        .sort(() => Math.random() - 0.5);

    } catch (error) {
      console.error('Error fetching trending:', error)
    } finally {
      isLoading.value = false
    }
  }

  return { trendingItems, fetchTrending, isLoading }
})
