const BLOCKED_MOVIES_KEY = 'blocked_movies';
const BLOCKED_SERIES_KEY = 'blocked_series';

export const getBlockedMovies = () => {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_MOVIES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getBlockedSeries = () => {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_SERIES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const blockMovie = (id) => {
  const blockedMovies = getBlockedMovies();
  if (!blockedMovies.includes(id)) {
    blockedMovies.push(id);
    localStorage.setItem(BLOCKED_MOVIES_KEY, JSON.stringify(blockedMovies));
  }
};

export const blockSeries = (id) => {
  const blockedSeries = getBlockedSeries();
  if (!blockedSeries.includes(id)) {
    blockedSeries.push(id);
    localStorage.setItem(BLOCKED_SERIES_KEY, JSON.stringify(blockedSeries));
  }
};

export const unblockMovie = (id) => {
  const blockedMovies = getBlockedMovies();
  const index = blockedMovies.indexOf(id);
  if (index > -1) {
    blockedMovies.splice(index, 1);
    localStorage.setItem(BLOCKED_MOVIES_KEY, JSON.stringify(blockedMovies));
  }
};

export const unblockSeries = (id) => {
  const blockedSeries = getBlockedSeries();
  const index = blockedSeries.indexOf(id);
  if (index > -1) {
    blockedSeries.splice(index, 1);
    localStorage.setItem(BLOCKED_SERIES_KEY, JSON.stringify(blockedSeries));
  }
};

export const isMovieBlocked = (id) => {
  return getBlockedMovies().includes(id);
};

export const isSeriesBlocked = (id) => {
  return getBlockedSeries().includes(id);
};
