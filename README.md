# OrbitIQ

OrbitIQ is a React Native (Expo) mobile app that delivers a space-operations dashboard. It aggregates launch schedules, mission briefs, vehicle statistics, space news, NASA APOD, and live ISS tracking into a single multi-tab hub with search and favorites.

## Highlights
- Live launch feed with countdowns and mission details.
- Space news feed with featured NASA APOD.
- Mission and vehicle intelligence panels built from launch data.
- ISS tracking map with live position updates.
- Favorites, recents, and local caching via AsyncStorage.

## Tech Stack
- React Native + Expo SDK 54
- React Navigation (native stack)
- Axios for API calls with retry and timeouts
- AsyncStorage for local persistence
- react-native-maps for ISS map and launch sites
- Expo Blur + Linear Gradient for UI visuals
- Reanimated and Gesture Handler for smooth interaction

## External APIs
- Launch Library 2 (The Space Devs): https://ll.thespacedevs.com/2.2.0
- Spaceflight News API v4: https://api.spaceflightnewsapi.net/v4
- NASA APOD: https://api.nasa.gov/planetary/apod
- Open Notify ISS: http://api.open-notify.org/iss-now.json

## App Flow
1. App bootstraps through Expo and loads a stack navigator.
2. Main hub shows a top tab switcher with Feed, Launches, Missions, Vehicles, Map, Favorites.
3. Screens call the API layer and a shared data hook for fetching.
4. Details screens log recents and render deeper info cards.
5. Favorites and cached APOD data are persisted locally.

## Project Structure
```
OrbitIQ/
  App.js
  index.js
  app.json
  package.json
  src/
    api/
      api.js
      client.js
      endpoints.js
    components/
      CountdownTimer.js
      EmptyState.js
      Header.js
      InfoChip.js
      LaunchCard.js
      Loader.js
      NewsCard.js
      SearchInput.js
      TopNavbar.js
      TopTabSwitcher.js
    hooks/
      useFetch.js
    navigation/
      AppNavigator.js
    screens/
      DetailsScreen.js
      ExploreScreen.js
      FavoritesScreen.js
      HomeScreen.js
      ISSScreen.js
      LaunchDetailsScreen.js
      LaunchesScreen.js
      MainHubScreen.js
      MapScreen.js
      MissionsScreen.js
      NewsDetailsScreen.js
      NotificationsScreen.js
      SearchScreen.js
      VehiclesScreen.js
    services/
      cacheService.js
      favoritesService.js
      recentService.js
      searchService.js
    styles/
      colors.js
      globalStyles.js
    utils/
      constants.js
      formatDate.js
```

## Key Modules
- API layer: centralized in src/api with retry logic and shared axios client.
- Data fetching: src/hooks/useFetch.js manages loading, refresh, and polling.
- Storage: src/services uses AsyncStorage for favorites, recents, and APOD cache.
- UI system: src/styles plus reusable components for cards, tabs, and nav.

## Scripts
- `npm start` - start Expo dev server
- `npm run android` - run on Android device/emulator
- `npm run ios` - run on iOS simulator
- `npm run web` - run on web

## Configuration Notes
- NASA APOD uses the demo key by default. Replace with a personal API key for higher limits.
- iOS ATS is relaxed in app.json to allow HTTP calls for Open Notify.

## How It Works (Data Overview)
- Launches and missions: Launch Library 2 feed provides upcoming and previous launches. Data is merged for missions and grouped for vehicles.
- News: Spaceflight News API v4 powers the news feed and notifications.
- APOD: NASA APOD is fetched and cached; a placeholder is used if the feed is down.
- ISS: Open Notify provides real-time ISS coordinates updated on a timer.

## No Custom Backend
This app calls public APIs directly and persists data locally. There is no custom backend server in this repository.

## Future Enhancements (Ideas)
- Push notifications for launch schedule changes.
- User accounts and cloud sync for favorites.
- Offline caching for launch and news feeds.
- Filterable search (date ranges, agencies, orbits).
