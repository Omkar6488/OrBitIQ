import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIssNow, getUpcomingLaunches } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatReadableTime, formatRelativeTime } from '../utils/formatDate';
import { ISS_REFRESH_MS, LIST_LIMIT, TRAJECTORY_STEP } from '../utils/constants';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const INITIAL_COORDINATE = {
  latitude: 10,
  longitude: 0,
};

const ORBIT_OFFSETS = {
  leo: { latitude: 9, longitude: 18 },
  meo: { latitude: 14, longitude: 28 },
  geo: { latitude: 2, longitude: 40 },
  polar: { latitude: 26, longitude: 6 },
  heliocentric: { latitude: 18, longitude: 30 },
  default: { latitude: 12, longitude: 20 },
};

function normalizeLongitude(longitude) {
  if (longitude > 180) {
    return longitude - 360;
  }

  if (longitude < -180) {
    return longitude + 360;
  }

  return longitude;
}

function parseCoordinate(latitude, longitude) {
  const lat = Number.parseFloat(latitude);
  const lon = Number.parseFloat(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    latitude: lat,
    longitude: normalizeLongitude(lon),
  };
}

function getOrbitOffset(orbitName = '') {
  const normalized = orbitName.toLowerCase();

  if (normalized.includes('polar')) {
    return ORBIT_OFFSETS.polar;
  }

  if (normalized.includes('geo') || normalized.includes('geostationary')) {
    return ORBIT_OFFSETS.geo;
  }

  if (normalized.includes('meo') || normalized.includes('medium')) {
    return ORBIT_OFFSETS.meo;
  }

  if (normalized.includes('helio')) {
    return ORBIT_OFFSETS.heliocentric;
  }

  if (normalized.includes('leo') || normalized.includes('low earth')) {
    return ORBIT_OFFSETS.leo;
  }

  return ORBIT_OFFSETS.default;
}

function buildPath(from, orbitName) {
  if (!from) {
    return [];
  }

  const offset = getOrbitOffset(orbitName);
  const target = {
    latitude: Math.max(-70, Math.min(70, from.latitude + offset.latitude)),
    longitude: normalizeLongitude(from.longitude + offset.longitude),
  };

  const points = [];
  const steps = Math.max(
    6,
    Math.round((Math.abs(offset.longitude) + Math.abs(offset.latitude)) / TRAJECTORY_STEP)
  );

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      latitude: from.latitude + (target.latitude - from.latitude) * t,
      longitude: normalizeLongitude(from.longitude + (target.longitude - from.longitude) * t),
    });
  }

  return points;
}

function buildLaunchSiteData(launches) {
  return (launches || [])
    .map((launch) => {
      const coordinate = parseCoordinate(launch?.pad?.latitude, launch?.pad?.longitude);
      if (!coordinate) {
        return null;
      }

      const orbitName = launch?.mission?.orbit?.name || '';

      return {
        id: launch?.id || `${launch?.name || 'launch'}-${launch?.net || ''}`,
        title: launch?.name || 'Untitled launch',
        location: launch?.pad?.name || launch?.pad?.location?.name || 'Unknown launch site',
        orbit: orbitName || 'Unknown orbit',
        provider: launch?.launch_service_provider?.name || 'Unknown provider',
        net: launch?.net,
        coordinate,
        launch,
        trajectory: buildPath(coordinate, orbitName),
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export default function MapScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
  hubOnScroll,
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const markerCoordinate = useRef(
    new AnimatedRegion({
      latitude: INITIAL_COORDINATE.latitude,
      longitude: INITIAL_COORDINATE.longitude,
      latitudeDelta: 35,
      longitudeDelta: 35,
    })
  ).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [launchSites, setLaunchSites] = useState([]);
  const [issCoordinate, setIssCoordinate] = useState(INITIAL_COORDINATE);
  const [issPath, setIssPath] = useState([]);
  const [issTimestamp, setIssTimestamp] = useState(null);
  const refreshSignalRef = useRef(refreshSignal);

  const loadMapData = useCallback(async () => {
    try {
      setError(null);
      const [issData, upcomingResponse] = await Promise.all([
        getIssNow(),
        getUpcomingLaunches({ limit: LIST_LIMIT, ordering: 'net' }),
      ]);

      const lat = Number.parseFloat(issData?.iss_position?.latitude);
      const lon = Number.parseFloat(issData?.iss_position?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const next = {
          latitude: lat,
          longitude: normalizeLongitude(lon),
        };

        markerCoordinate.timing({
          latitude: next.latitude,
          longitude: next.longitude,
          duration: ISS_REFRESH_MS - 400,
          useNativeDriver: false,
        }).start();

        mapRef.current?.animateCamera(
          {
            center: next,
            heading: 0,
            pitch: 0,
            zoom: 2,
          },
          {
            duration: 1100,
          }
        );

        setIssCoordinate(next);
        setIssTimestamp(issData?.timestamp || null);
        setIssPath((current) => [...current.slice(-80), next]);
      }

      const nextLaunchSites = buildLaunchSiteData(upcomingResponse?.results || []);
      setLaunchSites(nextLaunchSites);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [markerCoordinate]);

  useEffect(() => {
    loadMapData();

    const timer = setInterval(() => {
      loadMapData();
    }, ISS_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadMapData]);

  useEffect(() => {
    if (refreshSignal === refreshSignalRef.current) {
      return;
    }

    refreshSignalRef.current = refreshSignal;
    setRefreshing(true);
    loadMapData();
  }, [loadMapData, refreshSignal]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMapData();
  }, [loadMapData]);

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);
  const issLastUpdated = useMemo(
    () => formatRelativeTime(issTimestamp ? new Date(Number(issTimestamp) * 1000).toISOString() : null),
    [issTimestamp]
  );

  const issLastUpdatedClock = useMemo(() => formatReadableTime(issTimestamp), [issTimestamp]);

  const launchSiteMarkers = useMemo(
    () =>
      launchSites.map((site) => (
        <React.Fragment key={site.id}>
          <Marker
            coordinate={site.coordinate}
            title={site.title}
            description={site.location}
            pinColor={colors.accent}
          />
          {site.trajectory.length > 1 ? (
            <Polyline
              coordinates={site.trajectory}
              strokeWidth={1.9}
              strokeColor="rgba(123,97,255,0.82)"
            />
          ) : null}
        </React.Fragment>
      )),
    [launchSites]
  );

  const renderLaunchSite = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.siteCard}
        onPress={() => navigation.navigate('LaunchDetails', { launch: item.launch })}
      >
        <Text style={styles.siteTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.siteMeta} numberOfLines={1}>{item.location}</Text>
        <Text style={styles.siteMeta} numberOfLines={1}>{item.orbit}</Text>
        <Text style={styles.siteMeta} numberOfLines={1}>{item.provider}</Text>
        <Text style={styles.siteEta}>
          {item.net ? formatRelativeTime(item.net) : 'Schedule unavailable'}
        </Text>
      </Pressable>
    ),
    [navigation]
  );

  if (loading && !launchSites.length && !issPath.length && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="ISS Tracker"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <Loader count={1} height={340} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !launchSites.length && !issPath.length && !loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="ISS Tracker"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="Map telemetry unavailable"
            message="OrbitIQ could not load ISS or launch site map data."
            onRetry={onRefresh}
            icon="map-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="ISS Tracker"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
          onRefreshPress={onRefresh}
        />
      ) : null}

      <AnimatedFlatList
        data={launchSites}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderLaunchSite}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            <Text style={styles.heroTitle}>ISS Tracker</Text>
            <Text style={styles.heroSubtitle}>
              Live ISS telemetry, launch-site markers, and projected orbital trajectories.
            </Text>

            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: issCoordinate.latitude,
                  longitude: issCoordinate.longitude,
                  latitudeDelta: 65,
                  longitudeDelta: 65,
                }}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
              >
                <Marker.Animated coordinate={markerCoordinate} title="ISS" description="Live orbital position" anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.issMarkerWrap}>
                    <View style={styles.issMarkerGlow} />
                    <View style={styles.issMarkerCore}>
                      <MaterialCommunityIcons name="satellite-variant" size={22} color="#FFFFFF" />
                    </View>
                  </View>
                </Marker.Animated>

                {issPath.length > 1 ? (
                  <Polyline
                    coordinates={issPath}
                    strokeWidth={2.2}
                    strokeColor="rgba(95,201,255,0.95)"
                    lineDashPattern={[1, 8]}
                  />
                ) : null}

                {launchSiteMarkers}
              </MapView>
              <View pointerEvents="none" style={styles.mapOverlay} />

              <View pointerEvents="none" style={styles.floatingInfoPanel}>
                <Text style={styles.floatingInfoTitle}>ISS LIVE</Text>
                <Text style={styles.floatingInfoText}>Lat {issCoordinate.latitude.toFixed(2)} • Lon {issCoordinate.longitude.toFixed(2)}</Text>
                <Text style={styles.floatingInfoTime}>Updated {issLastUpdatedClock} ({issLastUpdated})</Text>
              </View>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>ISS Live</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Launch Sites</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#A88BFF' }]} />
                <Text style={styles.legendText}>Flight Path</Text>
              </View>
            </View>

            <View style={styles.telemetryBar}>
              <Text style={styles.telemetryText}>ISS Latitude: {issCoordinate.latitude.toFixed(2)}</Text>
              <Text style={styles.telemetryText}>ISS Longitude: {issCoordinate.longitude.toFixed(2)}</Text>
              <Text style={styles.telemetryText}>Last Updated: {issLastUpdatedClock}</Text>
            </View>

            <Text style={styles.sectionTitle}>Upcoming Launch Sites</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No launch-site coordinates"
            message="Launch records are available, but coordinate data was not provided by the feed."
            onRetry={onRefresh}
            icon="location-outline"
          />
        }
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        maxToRenderPerBatch={5}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 14,
  },
  mapWrap: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    height: 310,
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.28)',
  },
  issMarkerWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issMarkerGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: 'rgba(79,209,255,0.28)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
  },
  issMarkerCore: {
    width: 30,
    height: 30,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(9,17,38,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingInfoPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(7,12,28,0.72)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  floatingInfoTitle: {
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
    marginBottom: 4,
  },
  floatingInfoText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  floatingInfoTime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  legendText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  telemetryBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  telemetryText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  siteCard: {
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    shadowColor: '#091126',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 7,
  },
  siteTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  siteMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  siteEta: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
