import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    Authorization: `Bearer COLOQUE AQUI A CHAVE DE LEITURA DA API`,
  },
})

export default api
