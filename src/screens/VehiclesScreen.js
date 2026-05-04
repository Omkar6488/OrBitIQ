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
import { Ionicons } from '@expo/vector-icons';
import { getPreviousLaunches, getUpcomingLaunches } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatDate } from '../utils/formatDate';
import { LIST_LIMIT } from '../utils/constants';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function buildVehicleData(upcoming, previous) {
  const upcomingList = Array.isArray(upcoming) ? upcoming : [];
  const previousList = Array.isArray(previous) ? previous : [];
  const grouped = new Map();

  const pushLaunch = (launch, type) => {
    const configuration = launch?.rocket?.configuration || {};
    const id = configuration?.id || configuration?.full_name || launch?.name || 'vehicle';

    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        name: configuration?.full_name || configuration?.name || 'Unknown vehicle',
        family: configuration?.family || 'Unknown family',
        variant: configuration?.variant || 'Unknown variant',
        manufacturer: configuration?.manufacturer?.name || 'Unknown manufacturer',
        status: configuration?.status || 'Unknown status',
        successCount: Number(configuration?.successful_launches || 0),
        failedCount: Number(configuration?.failed_launches || 0),
        upcomingCount: 0,
        historicalCount: 0,
        nextLaunch: null,
        lastLaunch: null,
      });
    }

    const record = grouped.get(id);

    if (type === 'upcoming') {
      record.upcomingCount += 1;
      if (!record.nextLaunch || new Date(launch?.net || 0).getTime() < new Date(record.nextLaunch?.net || 0).getTime()) {
        record.nextLaunch = launch;
      }
    }

    if (type === 'historical') {
      record.historicalCount += 1;
      if (!record.lastLaunch || new Date(launch?.net || 0).getTime() > new Date(record.lastLaunch?.net || 0).getTime()) {
        record.lastLaunch = launch;
      }
    }
  };

  upcomingList.forEach((launch) => pushLaunch(launch, 'upcoming'));
  previousList.forEach((launch) => pushLaunch(launch, 'historical'));

  return Array.from(grouped.values()).sort((a, b) => b.upcomingCount - a.upcomingCount || b.historicalCount - a.historicalCount);
}

function getReliability(successCount, failedCount) {
  const total = successCount + failedCount;
  if (!total) {
    return '--';
  }

  return `${Math.round((successCount / total) * 100)}%`;
}

export default function VehiclesScreen({
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
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({ active: 0, upcoming: 0, historical: 0 });
  const lastRefreshSignal = useRef(refreshSignal);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [upcomingResponse, previousResponse] = await Promise.all([
        getUpcomingLaunches({ limit: LIST_LIMIT, ordering: 'net' }),
        getPreviousLaunches({ limit: LIST_LIMIT, ordering: '-net' }),
      ]);

      const upcoming = Array.isArray(upcomingResponse?.results) ? upcomingResponse.results : [];
      const previous = Array.isArray(previousResponse?.results) ? previousResponse.results : [];

      const grouped = buildVehicleData(upcoming, previous);
      setVehicles(grouped);
      setSummary({
        active: grouped.length,
        upcoming: upcoming.length,
        historical: previous.length,
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

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);

  if (loading && vehicles.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Vehicle Registry"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <Loader count={4} height={160} compact />
        </View>
      </SafeAreaView>
    );
  }

  if (error && vehicles.length === 0 && !loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Vehicle Registry"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="Vehicle registry unavailable"
            message="OrbitIQ could not retrieve vehicle data."
            onRetry={onRefresh}
            icon="construct-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Vehicle Registry"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
          onRefreshPress={onRefresh}
        />
      ) : null}

      <AnimatedFlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.manufacturer}</Text>
              </View>
              <View style={styles.familyTag}>
                <Text style={styles.familyTagText}>{item.family}</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Reliability</Text>
                <Text style={styles.metricValue}>{getReliability(item.successCount, item.failedCount)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Upcoming</Text>
                <Text style={styles.metricValue}>{item.upcomingCount}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Historical</Text>
                <Text style={styles.metricValue}>{item.historicalCount}</Text>
              </View>
            </View>

            <View style={styles.launchInfoRow}>
              <View style={styles.launchInfoItem}>
                <Text style={styles.launchInfoLabel}>Next Launch</Text>
                <Text style={styles.launchInfoText} numberOfLines={2}>
                  {item?.nextLaunch?.name || 'No upcoming launch'}
                </Text>
                <Text style={styles.launchInfoDate}>
                  {item?.nextLaunch?.net ? formatDate(item.nextLaunch.net, { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                </Text>
              </View>

              <View style={styles.launchInfoItem}>
                <Text style={styles.launchInfoLabel}>Latest Launch</Text>
                <Text style={styles.launchInfoText} numberOfLines={2}>
                  {item?.lastLaunch?.name || 'No historical launch'}
                </Text>
                <Text style={styles.launchInfoDate}>
                  {item?.lastLaunch?.net ? formatDate(item.lastLaunch.net, { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, !item?.nextLaunch && styles.actionDisabled]}
                onPress={() => item?.nextLaunch && navigation.navigate('LaunchDetails', { launch: item.nextLaunch })}
                disabled={!item?.nextLaunch}
              >
                <Ionicons name="rocket-outline" size={14} color={colors.textPrimary} />
                <Text style={styles.actionText}>Open Next</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, !item?.lastLaunch && styles.actionDisabled]}
                onPress={() => item?.lastLaunch && navigation.navigate('LaunchDetails', { launch: item.lastLaunch })}
                disabled={!item?.lastLaunch}
              >
                <Ionicons name="time-outline" size={14} color={colors.textPrimary} />
                <Text style={styles.actionText}>Open Latest</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.heroTitle}>Vehicle Registry</Text>
            <Text style={styles.heroSubtitle}>Launch vehicle fleet analytics, reliability, and mission cadence.</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Vehicles</Text>
                <Text style={styles.summaryValue}>{summary.active}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Upcoming</Text>
                <Text style={styles.summaryValue}>{summary.upcoming}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Historical</Text>
                <Text style={styles.summaryValue}>{summary.historical}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No vehicles discovered"
            message="No rocket configurations were returned from current launch feeds."
            onRetry={onRefresh}
            icon="rocket-outline"
          />
        }
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={7}
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  familyTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(123,97,255,0.42)',
    backgroundColor: 'rgba(123,97,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  familyTagText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(4,8,20,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginBottom: 6,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  launchInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  launchInfoItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
  },
  launchInfoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginBottom: 6,
  },
  launchInfoText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    minHeight: 34,
  },
  launchInfoDate: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.35)',
    backgroundColor: 'rgba(79,209,255,0.14)',
    paddingVertical: 9,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
