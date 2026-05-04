import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getIssNow } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import useFetch from '../hooks/useFetch';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatReadableTime } from '../utils/formatDate';
import { ISS_REFRESH_MS } from '../utils/constants';

const INITIAL_COORDINATE = {
  latitude: 20,
  longitude: 20,
};

export default function ISSScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const markerCoordinate = useRef(
    new AnimatedRegion({
      latitude: INITIAL_COORDINATE.latitude,
      longitude: INITIAL_COORDINATE.longitude,
      latitudeDelta: 28,
      longitudeDelta: 28,
    })
  ).current;
  const [pathPoints, setPathPoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(INITIAL_COORDINATE);
  const lastRefreshSignal = useRef(refreshSignal);

  const fetchIss = useCallback(() => getIssNow(), []);

  const {
    data,
    loading,
    error,
    lastUpdated: refreshTime,
    refetch,
  } = useFetch(fetchIss, {
    intervalMs: ISS_REFRESH_MS,
  });

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    refetch();
  }, [refetch, refreshSignal]);

  useEffect(() => {
    const lat = Number.parseFloat(data?.iss_position?.latitude);
    const lon = Number.parseFloat(data?.iss_position?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    const nextCoordinate = {
      latitude: lat,
      longitude: lon,
    };

    markerCoordinate.timing({
      latitude: lat,
      longitude: lon,
      duration: 1300,
      useNativeDriver: false,
    }).start();

    setCurrentLocation(nextCoordinate);
    setPathPoints((prev) => [...prev.slice(-60), nextCoordinate]);

    mapRef.current?.animateToRegion(
      {
        ...nextCoordinate,
        latitudeDelta: 42,
        longitudeDelta: 42,
      },
      1200
    );
  }, [data, markerCoordinate]);

  const latitude = currentLocation?.latitude?.toFixed(4) || '--';
  const longitude = currentLocation?.longitude?.toFixed(4) || '--';
  const lastIssUpdate = useMemo(() => formatReadableTime(data?.timestamp), [data?.timestamp]);
  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);

  if (loading && !data) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="ISS Live Orbit"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={refetch}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <Loader count={1} height={280} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="ISS Live Orbit"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={refetch}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="ISS signal unavailable"
            message="The Open Notify endpoint may be temporarily offline."
            onRetry={refetch}
            icon="location-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="ISS Live Orbit"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
          onRefreshPress={refetch}
        />
      ) : null}

      <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
        <Text style={styles.heroTitle}>Orbital Telemetry</Text>
        <Text style={styles.heroSubtitle}>Real-time trajectory update every 5 seconds.</Text>

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 42,
              longitudeDelta: 42,
            }}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
          >
            <Marker.Animated coordinate={markerCoordinate} title="ISS" description="Live position" />
            {pathPoints.length > 1 ? (
              <Polyline coordinates={pathPoints} strokeWidth={2.2} strokeColor="rgba(79,209,255,0.75)" />
            ) : null}
          </MapView>
          <View pointerEvents="none" style={styles.mapGlow} />
        </View>

        <View style={styles.telemetryCard}>
          <Text style={styles.label}>LATITUDE</Text>
          <Text style={styles.value}>{latitude}</Text>
          <Text style={[styles.label, styles.labelSpacing]}>LONGITUDE</Text>
          <Text style={styles.value}>{longitude}</Text>
          <Text style={styles.updatedAt}>ISS update: {lastIssUpdate}</Text>
          <Text style={styles.updatedAt}>Screen sync: {refreshTime ? new Date(refreshTime).toLocaleTimeString() : '--'}</Text>

          <Pressable style={styles.refreshButton} onPress={refetch}>
            <Text style={styles.refreshText}>Refresh Position</Text>
          </Pressable>
        </View>
      </View>
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
    marginBottom: 16,
  },
  mapWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    height: 270,
    marginBottom: 14,
  },
  map: {
    flex: 1,
  },
  mapGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.32)',
    borderRadius: 22,
  },
  telemetryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  labelSpacing: {
    marginTop: 16,
  },
  value: {
    color: colors.primary,
    marginTop: 5,
    fontSize: 32,
    fontWeight: '800',
  },
  updatedAt: {
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 13,
  },
  refreshButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  refreshText: {
    color: '#041018',
    fontWeight: '700',
  },
});
