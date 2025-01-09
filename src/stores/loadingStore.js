import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(true)
  const progress = ref(0)

  function updateProgress(value) {
    progress.value = value
  }

  function setLoading(value) {
    isLoading.value = value
  }

  return {
    isLoading,
    progress,
    updateProgress,
    setLoading
  }
})
