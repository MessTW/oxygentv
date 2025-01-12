import axios from 'axios'

// Создаем простой кэш
const cache = new Map()

// Функция для создания ключа кэша
const getCacheKey = (config) => {
  return `${config.url}${JSON.stringify(config.params || {})}`
}

// Создаем axios инстанс с перехватчиками
const api = axios.create({
  baseURL: 'https://apitmdb.cub.red/3/',
})

// Добавляем параметр api_key по умолчанию для всех запросов
api.interceptors.request.use(config => {
  config.params = {
    ...config.params,
    api_key: 'd341436234a2bb8f0adc73114e093ab2'
  }
  return config
})

// Добавляем перехватчик запросов
api.interceptors.request.use(config => {
  // Проверяем кэш только для GET запросов
  if (config.method === 'get') {
    const cacheKey = getCacheKey(config)
    const cachedResponse = cache.get(cacheKey)

    if (cachedResponse) {
      // Возвращаем закэшированный ответ
      return Promise.reject({
        config,
        response: cachedResponse,
        fromCache: true
      })
    }
  }
  return config
})

// Добавляем перехватчик ответов
api.interceptors.response.use(
  response => {
    // Кэшируем успешные GET запросы
    if (response.config.method === 'get') {
      const cacheKey = getCacheKey(response.config)
      cache.set(cacheKey, response)
    }
    return response
  },
  error => {
    // Если ошибка из-за кэша, возвращаем закэшированный ответ
    if (error.fromCache && error.response) {
      return error.response
    }
    return Promise.reject(error)
  }
)

export default api
