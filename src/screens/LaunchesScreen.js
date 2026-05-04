import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUpcomingLaunches } from '../api/api';
import EmptyState from '../components/EmptyState';
import LaunchCard from '../components/LaunchCard';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import useFetch from '../hooks/useFetch';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { LAUNCH_REFRESH_MS, LIST_LIMIT } from '../utils/constants';
import { getFavoritesMap, toggleFavoriteLaunch } from '../services/favoritesService';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function LaunchesScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
  hubOnScroll,
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState({});
  const lastRefreshSignal = useRef(refreshSignal);

  const fetchLaunches = useCallback(() => getUpcomingLaunches({ limit: LIST_LIMIT }), []);

  const {
    data,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useFetch(fetchLaunches, {
    initialData: { results: [] },
    intervalMs: LAUNCH_REFRESH_MS,
  });

  const launches = useMemo(() => data?.results || [], [data]);
  const favoriteCount = useMemo(() => Object.keys(favoritesMap).length, [favoritesMap]);

  useEffect(() => {
    getFavoritesMap().then(setFavoritesMap);
  }, []);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch, refreshSignal]);

  const toggleFavorite = useCallback(async (launch) => {
    const next = await toggleFavoriteLaunch(launch);
    setFavoritesMap(next.favoritesMap);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openDetails = useCallback(
    (launch) => {
      navigation.navigate('LaunchDetails', { launch });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <LaunchCard
        launch={item}
        onPress={() => openDetails(item)}
        onToggleFavorite={() => toggleFavorite(item)}
        isFavorite={!!favoritesMap[item.id]}
      />
    ),
    [favoritesMap, openDetails, toggleFavorite]
  );

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);

  if (loading && launches.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Launch Console"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <Loader count={4} height={220} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && launches.length === 0 && !loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Launch Console"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="Unable to load launches"
            message="Try again in a few seconds."
            onRetry={refetch}
            icon="rocket-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  const featuredLaunch = launches[0];

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Launch Console"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
          onRefreshPress={onRefresh}
        />
      ) : null}

      <AnimatedFlatList
        data={launches}
        keyExtractor={(item, index) => `${item.id || 'launch'}-${index}`}
        renderItem={renderItem}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.heroTitle}>Launch Pulse</Text>
            <Text style={styles.heroSubtitle}>Tracked missions with status, agency intelligence, and orbit destination.</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoText}>Favorites: {favoriteCount}</Text>
              <Text style={styles.infoText}>
                Sync: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--'}
              </Text>
            </View>

            {featuredLaunch ? (
              <View style={styles.trendingCard}>
                <Text style={styles.trendingLabel}>TRENDING MISSION</Text>
                <Text style={styles.trendingTitle} numberOfLines={1}>
                  {featuredLaunch?.name || 'Untitled mission'}
                </Text>
                <Text style={styles.trendingMeta} numberOfLines={1}>
                  {(featuredLaunch?.launch_service_provider?.name || 'Unknown agency') + ' • ' +
                    (featuredLaunch?.mission?.orbit?.name || 'Unknown orbit')}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No launches scheduled"
              message="No mission records are available right now."
              onRetry={refetch}
              icon="timer-outline"
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  trendingCard: {
    borderWidth: 1,
    borderColor: 'rgba(123,97,255,0.3)',
    backgroundColor: 'rgba(123,97,255,0.12)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  trendingLabel: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 6,
  },
  trendingTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendingMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
