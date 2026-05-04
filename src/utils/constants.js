export const STORAGE_KEYS = {
  FAVORITE_LAUNCHES: '@orbitiq/favorite_launches',
  FAVORITE_NEWS: '@orbitiq/favorite_news',
  RECENT_ITEMS: '@orbitiq/recent_items',
  APOD_CACHE: '@orbitiq/apod_cache',
};

export const LIST_LIMIT = 20;

export const API_TIMEOUT = 8000;
export const API_RETRY_ATTEMPTS = 2;

export const APOD_PLACEHOLDER = {
  date: '1970-01-01',
  title: 'OrbitIQ Visual Feed',
  explanation:
    'Live APOD data is temporarily unavailable. OrbitIQ remains online with cached visuals and real-time mission signals.',
  url: 'https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg',
};

export const ISS_REFRESH_MS = 5000;
export const LAUNCH_REFRESH_MS = 60000;
export const TRAJECTORY_STEP = 1.6;

export const SEARCH_MIN_CHARS = 2;

export const EXPLORE_PLANETS = [
  {
    id: 'planet-1',
    title: 'Mars Operations',
    description: 'Daily rover insights from Jezero Crater and atmospheric readings.',
  },
  {
    id: 'planet-2',
    title: 'Europa Recon',
    description: 'Icy moon mapping updates and deep-ocean habitability studies.',
  },
  {
    id: 'planet-3',
    title: 'Lunar Surface Grid',
    description: 'High-resolution scans for future Artemis landing corridors.',
  },
];

export const EXPLORE_MISSIONS = [
  {
    id: 'mission-1',
    title: 'Artemis Program',
    description: 'Crewed Moon return architecture, Orion capsule updates, and timeline.',
  },
  {
    id: 'mission-2',
    title: 'James Webb Science',
    description: 'Latest deep-space observations and exoplanet atmosphere analysis.',
  },
  {
    id: 'mission-3',
    title: 'Commercial LEO',
    description: 'Private station modules, cargo cadence, and orbital logistics growth.',
  },
];
