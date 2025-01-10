/**
 * Поиск ID фильма/сериала через Kinobox API
 * @param {string} title - Название фильма/сериала
 * @param {string} year - Год выпуска
 * @returns {Promise<string>} ID фильма
 */
export async function getKinopoiskId(title, year) {
  try {
    // Формируем поисковый запрос с названием и годом
    const query = `${title} ${year}`;
    const response = await fetch(`https://kinobox.tv/api/films/search/?title=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();

    // Если есть результаты, берем первый фильм
    if (results && results.length > 0) {
      // Ищем точное совпадение по году
      const exactMatch = results.find(item =>
        String(item.year) === String(year) &&
        item.title.toLowerCase().includes(title.toLowerCase())
      );

      if (exactMatch) {
        return exactMatch.id || '';
      }

      // Если точного совпадения нет, берем первый результат
      return results[0].id || '';
    }

    console.log('No results found for:', query);
    return '';

  } catch (error) {
    console.error('Error searching movie:', error);
    return '';
  }
}
