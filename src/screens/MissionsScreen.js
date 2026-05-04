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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPreviousLaunches, getUpcomingLaunches } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatDate, formatRelativeTime } from '../utils/formatDate';
import { LIST_LIMIT } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { addBookmark, deleteBookmark, getBookmarks } from '../firebase/firestore';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function buildMissionRecords(upcoming, previous) {
  const merged = [...(upcoming || []), ...(previous || [])];
  const map = new Map();
  const now = Date.now();

  merged.forEach((launch) => {
    const mission = launch?.mission || {};
    const key = mission?.id || `${mission?.name || launch?.name || 'mission'}-${launch?.net || ''}`;

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        title: mission?.name || launch?.name || 'Untitled mission',
        status: launch?.status?.name || 'Scheduled',
        type: mission?.type || 'General Mission',
        provider: launch?.launch_service_provider?.name || 'Unknown agency',
        orbit: mission?.orbit?.name || 'Unspecified orbit',
        description: mission?.description || 'No mission brief available.',
        net: launch?.net,
        launch,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a?.net || 0).getTime();
    const timeB = new Date(b?.net || 0).getTime();
    const upcomingA = timeA >= now;
    const upcomingB = timeB >= now;

    if (upcomingA !== upcomingB) {
      return upcomingA ? -1 : 1;
    }

    if (upcomingA) {
      return timeA - timeB;
    }

    return timeB - timeA;
  });
}

export default function MissionsScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
  hubOnScroll,
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState({ upcoming: 0, previous: 0, agencies: 0 });
  const [bookmarksMap, setBookmarksMap] = useState({});
  const lastRefreshSignal = useRef(refreshSignal);
  const { currentUser } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [upcoming, previous] = await Promise.all([
        getUpcomingLaunches({ limit: LIST_LIMIT, ordering: 'net' }),
        getPreviousLaunches({ limit: LIST_LIMIT, ordering: '-net' }),
      ]);

      const upcomingResults = Array.isArray(upcoming?.results) ? upcoming.results : [];
      const previousResults = Array.isArray(previous?.results) ? previous.results : [];
      const missionRecords = buildMissionRecords(upcomingResults, previousResults);
      const agencies = new Set(
        missionRecords
          .map((item) => item.provider)
          .filter(Boolean)
      );

      setMissions(missionRecords);
      setStats({
        upcoming: upcomingResults.length,
        previous: previousResults.length,
        agencies: agencies.size,
      });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    setRefreshing(true);
    loadData();
  }, [loadData, refreshSignal]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setBookmarksMap({});
      return;
    }

    getBookmarks(currentUser.uid).then((items) => {
      const nextMap = items.reduce((acc, item) => {
        const key = item?.sourceId || item?.id;
        if (key) {
          acc[key] = item;
        }
        return acc;
      }, {});
      setBookmarksMap(nextMap);
    });
  }, [currentUser?.uid]);

  const onToggleFavorite = useCallback(
    async (mission) => {
      if (!mission?.launch || !currentUser?.uid) {
        return;
      }

      const sourceId = mission.launch.id;
      if (!sourceId) {
        return;
      }

      const existing = bookmarksMap[sourceId];
      if (existing?.id) {
        await deleteBookmark(currentUser.uid, existing.id);
        setBookmarksMap((current) => {
          const next = { ...current };
          delete next[sourceId];
          return next;
        });
        return;
      }

      const payload = {
        sourceId,
        title: mission.title || mission.launch?.name || 'Untitled mission',
        type: 'launch',
        timestamp: Date.now(),
        data: mission.launch,
      };

      const docRef = await addBookmark(currentUser.uid, payload);
      setBookmarksMap((current) => ({
        ...current,
        [sourceId]: { id: docRef.id, ...payload },
      }));
    },
    [bookmarksMap, currentUser?.uid]
  );

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);

  if (loading && missions.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Mission Intelligence"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}>
          <Loader count={3} height={176} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && missions.length === 0 && !loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Mission Intelligence"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}>
          <EmptyState
            title="Mission stream unavailable"
            message="OrbitIQ could not load mission intelligence. Retry in a moment."
            onRetry={onRefresh}
            icon="analytics-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Mission Intelligence"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
          onRefreshPress={onRefresh}
        />
      ) : null}

      <AnimatedFlatList
        data={missions}
        keyExtractor={(item) => String(item.id)}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const favoriteKey = item?.launch?.id;
          const isFavorite = favoriteKey ? !!bookmarksMap[favoriteKey] : false;

          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
              onPress={() => navigation.navigate('LaunchDetails', { launch: item.launch })}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <Pressable
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    onToggleFavorite(item);
                  }}
                  style={styles.favoriteButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={18}
                    color={isFavorite ? colors.primary : colors.textSecondary}
                  />
                </Pressable>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={3}>
                {item.description}
              </Text>

              <View style={styles.metaWrap}>
                <Text style={styles.metaText}>{item.provider}</Text>
                <Text style={styles.metaText}>{item.type}</Text>
                <Text style={styles.metaText}>{item.orbit}</Text>
              </View>

              <Text style={styles.cardDate}>
                {formatDate(item.net, { month: 'short', day: 'numeric', year: 'numeric' })} ({formatRelativeTime(item.net)})
              </Text>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View>
            <Text style={styles.heroTitle}>Mission Intelligence</Text>
            <Text style={styles.heroSubtitle}>
              Strategic mission records with operator, orbit, and schedule context.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Upcoming</Text>
                <Text style={styles.statValue}>{stats.upcoming}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Historical</Text>
                <Text style={styles.statValue}>{stats.previous}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Agencies</Text>
                <Text style={styles.statValue}>{stats.agencies}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No mission records"
            message="There are no mission entries available right now."
            onRetry={onRefresh}
            icon="layers-outline"
          />
        }
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={8}
        maxToRenderPerBatch={6}
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  statValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    marginBottom: 12,
  },
  pressedCard: {
    transform: [{ scale: 0.99 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.42)',
    backgroundColor: 'rgba(79,209,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4,8,20,0.65)',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaWrap: {
    gap: 4,
    marginBottom: 10,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cardDate: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
