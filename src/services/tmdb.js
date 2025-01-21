import { API_KEY, TMDB_BASE_URL } from '@/config/api'

export const fetchDetails = async (type, id) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ru&append_to_response=videos,images`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching details:', error)
    return null
  }
}

export const fetchTrending = async () => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ru&append_to_response=images`
    )
    const data = await response.json()
    // Получаем логотипы для каждого элемента
    const itemsWithLogos = await Promise.all(
      data.results.map(async (item) => {
        const isMovie = item.media_type === 'movie';
        const detailsResponse = await fetch(
          `${TMDB_BASE_URL}/${isMovie ? 'movie' : 'tv'}/${item.id}?api_key=${API_KEY}&language=ru&append_to_response=images&include_image_language=ru,en,null`
        );
        const details = await detailsResponse.json();

        return {
          ...item,
          images: {
            logos: details.images?.logos || []
          }
        };
      })
    );
    return itemsWithLogos;
  } catch (error) {
    console.error('Error fetching trending:', error)
    return []
  }
}

export const searchContent = async (query) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&language=ru&query=${encodeURIComponent(
        query
      )}`
    )
    const data = await response.json()
    return data.results
  } catch (error) {
    console.error('Error searching content:', error)
    return []
  }
}

export const fetchSeasonDetails = async (seriesId, seasonNumber) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}&language=ru`
    );
    const data = await response.json();
    return data.episodes || [];
  } catch (error) {
    console.error('Error fetching season details:', error);
    return [];
  }
}

export const fetchGenres = async (type) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/${type}/list?api_key=${API_KEY}&language=ru`
    )
    const data = await response.json()
    return data.genres || []
  } catch (error) {
    console.error('Error fetching genres:', error)
    return []
  }
}

// Поиск фильмов
export const searchMovies = async (query, page = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=ru`
  );
  if (!response.ok) throw new Error('Failed to fetch movies');
  return response.json();
};

// Поиск сериалов
export const searchTVShows = async (query, page = 1) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=ru`
  );
  if (!response.ok) throw new Error('Failed to fetch TV shows');
  return response.json();
};

// Получение деталей фильма
export const getMovieDetails = async (id) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ru`
  );
  if (!response.ok) throw new Error('Failed to fetch movie details');
  return response.json();
};

// Получение деталей сериала
export const getTVShowDetails = async (id) => {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/${id}?api_key=${API_KEY}&language=ru`
  );
  if (!response.ok) throw new Error('Failed to fetch TV show details');
  return response.json();
};

export const searchKinopoiskId = async (title, type, year) => {
  try {
    // Преобразуем тип для API Kinobox
    const kinoboxType = type === 'tv' ? 'Series' : 'Film';

    console.log('Making request to Kinobox API:', {
      title: title,
      type: kinoboxType,
      year
    });

    const KINOBOX_URL = 'https://kinobox.tv/api/films/search';

    const response = await fetch(`${KINOBOX_URL}/?title=${encodeURIComponent(title)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from API');
    }

    let data = [];

    try {
      data = await response.json() || [];
    } catch (e) {
      console.log('Error parsing response:', e);
    }

    console.log('Kinobox API response:', {
      results: data
    });

    // Ищем точное совпадение по названию, типу и году
    const exactMatch = data.find(item => {
      const matchesType = item.type === kinoboxType;
      const matchesYear = parseInt(item.year) === year;
      const matchesTitle = item.alternativeTitle?.toLowerCase() === title.toLowerCase();
      return matchesType && matchesYear && matchesTitle;
    });

    if (exactMatch) {
      console.log('Found exact match:', exactMatch);
      return exactMatch.id;
    }

    // Если точного совпадения нет, ищем по типу и названию
    const typeMatch = data.find(item => {
      const matchesType = item.type === kinoboxType;
      const matchesTitle = item.alternativeTitle?.toLowerCase() === title.toLowerCase();
      return matchesType && matchesTitle;
    });

    console.log('Found type match:', typeMatch);
    return typeMatch?.id || null;
  } catch (error) {
    console.error('Error fetching Kinopoisk ID:', error);
    return null;
  }
};
