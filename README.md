# OrbitIQ

OrbitIQ is a React Native (Expo) space-operations dashboard. It aggregates live launch schedules, mission briefs, vehicle intelligence, space news, NASA APOD (image or video), and an ISS tracker into a single multi-tab hub with search and Firebase-backed favorites.

## Highlights
- Feed with APOD media card (image or video) and latest space news.
- Launch console with countdowns, status chips, and mission details.
- Mission intelligence and vehicle registry derived from launch data.
- ISS tracker map (native) with live position updates and path history.
- Firebase Auth (email + Google) with Firestore bookmarks per user.
- Cached APOD data + resilient loading and error states.

## Tech Stack
- React Native + Expo SDK 54
- React Navigation (native stack)
- Firebase Auth + Firestore (modular v9)
- Axios with retry/timeouts
- AsyncStorage for cache and recents
- react-native-maps (native map) + web fallback
- react-native-webview for APOD video embeds
- Expo Blur + Linear Gradient UI

## External APIs
- Launch Library 2 (The Space Devs): https://ll.thespacedevs.com/2.2.0
- Spaceflight News API v4: https://api.spaceflightnewsapi.net/v4
- NASA APOD: https://api.nasa.gov/planetary/apod
- Open Notify ISS: http://api.open-notify.org/iss-now.json

## App Flow
1. App bootstraps through Expo and mounts a native stack navigator.
2. Main hub tabs: Feed, Launches, Missions, Vehicles, Map, Favorites.
3. Screens load data through the API layer and shared `useFetch` hook.
4. APOD renders image or embedded video based on `media_type`.
5. Auth routes support email/password, Google sign-in, and guest entry.
6. Bookmarks are stored per user in Firestore.

## Project Structure
```
OrbitIQ/
  App.js
  index.js
  app.json
  eas.json
  package.json
  src/
    api/
      api.js
      client.js
      endpoints.js
    components/
      CountdownTimer.js
      EmptyState.js
      InfoChip.js
      LaunchCard.js
      Loader.js
      NewsCard.js
      SearchInput.js
      TopNavbar.js
      TopTabSwitcher.js
    context/
      AuthContext.js
    firebase/
      auth.js
      config.js
      firestore.js
    hooks/
      useFetch.js
    navigation/
      AppNavigator.js
    screens/
      FavoritesScreen.js
      HomeScreen.js
      LaunchDetailsScreen.js
      LaunchesScreen.js
      LoginScreen.js
      MainHubScreen.js
      MapScreen.js
      MapScreen.web.js
      MissionsScreen.js
      NewsDetailsScreen.js
      NotificationsScreen.js
      ProfileScreen.js
      SearchScreen.js
      SignupScreen.js
      VehiclesScreen.js
    services/
      cacheService.js
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
- API layer: centralized in `src/api` with retry logic and shared axios client.
- Data fetching: `src/hooks/useFetch.js` manages loading, refresh, and polling.
- Auth: `src/context/AuthContext.js` wraps Firebase Auth with persistence.
- Firestore: `src/firebase/firestore.js` stores bookmarks per user.
- UI system: `src/styles` and reusable components for cards, tabs, and nav.

## Scripts
- `npm start` - start Expo dev server
- `npm run android` - run on Android device/emulator
- `npm run ios` - run on iOS simulator
- `npm run web` - run on web

## Configuration Notes
- `app.json` includes `scheme` for deep links, Android package ID, and icons.
- NASA APOD uses `DEMO_KEY` by default. Replace with a personal API key for higher limits.
- iOS ATS is relaxed to allow HTTP calls for Open Notify.

## APOD Media Handling
- `media_type === "image"`: render `hdurl` or `url`.
- `media_type === "video"`: render `WebView` using the APOD `url` (YouTube/Vimeo supported).
- If video fails: show "Video cannot be loaded" fallback.

## Firebase Notes
- Auth uses AsyncStorage persistence so sessions survive restarts.
- Bookmarks are written to `users/{uid}/bookmarks`.
- Firebase config is in `src/firebase/config.js`.

## EAS Build (APK)
1. Install EAS CLI: `npm install -g eas-cli`
2. Initialize (one-time): `eas init`
3. Build APK: `eas build -p android --profile preview`

`eas.json` includes:
```
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Environment & Runtime Warnings
- If you see an EAS prompt crash on Windows with Node 22, switch to Node 20 LTS and retry.
- Expo Linking warnings are resolved by `scheme` in `app.json`.

## No Custom Backend
This app calls public APIs directly and persists data with Firebase and local storage. There is no custom backend server in this repo.
