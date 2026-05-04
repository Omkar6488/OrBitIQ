import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSpaceNews, getUpcomingLaunches } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatRelativeTime } from '../utils/formatDate';

function buildNotifications(launches, articles) {
  const launchSignals = (launches || []).slice(0, 7).map((launch) => ({
    id: `launch-${launch?.id || launch?.name}`,
    type: 'launch',
    title: launch?.name || 'Upcoming launch update',
    subtitle: launch?.status?.name || 'Status updated',
    time: launch?.net,
    payload: launch,
  }));

  const articleSignals = (articles || []).slice(0, 7).map((article) => ({
    id: `news-${article?.id || article?.url}`,
    type: 'news',
    title: article?.title || 'Space article update',
    subtitle: article?.news_site || 'Space publication',
    time: article?.published_at,
    payload: article,
  }));

  return [...launchSignals, ...articleSignals].sort(
    (a, b) => new Date(b?.time || 0).getTime() - new Date(a?.time || 0).getTime()
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [seenMap, setSeenMap] = useState({});

  const loadData = useCallback(async () => {
    try {
      setError(null);

      const [launchResponse, newsResponse] = await Promise.all([
        getUpcomingLaunches({ limit: 10, ordering: 'net' }),
        getSpaceNews({ limit: 10, ordering: '-published_at' }),
      ]);

      const merged = buildNotifications(
        Array.isArray(launchResponse?.results) ? launchResponse.results : [],
        Array.isArray(newsResponse?.results) ? newsResponse.results : []
      );

      setNotifications(merged);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const topPadding = getNavbarContentOffset(insets);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !seenMap[item.id]).length,
    [notifications, seenMap]
  );

  if (loading && notifications.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        <TopNavbar title="Notifications" onLeftPress={() => navigation.goBack()} showSearch={false} showNotify={false} />
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <Loader count={4} height={126} compact />
        </View>
      </SafeAreaView>
    );
  }

  if (error && notifications.length === 0 && !loading) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        <TopNavbar title="Notifications" onLeftPress={() => navigation.goBack()} showSearch={false} showNotify={false} />
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="Unable to fetch notifications"
            message="OrbitIQ could not pull updates from launch and news feeds."
            onRetry={onRefresh}
            icon="notifications-outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar title="Notifications" onLeftPress={() => navigation.goBack()} showSearch={false} showNotify={false} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const seen = !!seenMap[item.id];

          return (
            <Pressable
              style={[styles.card, seen && styles.cardSeen]}
              onPress={() => {
                setSeenMap((current) => ({ ...current, [item.id]: true }));

                if (item.type === 'launch') {
                  navigation.navigate('LaunchDetails', { launch: item.payload });
                  return;
                }

                navigation.navigate('NewsDetails', { article: item.payload });
              }}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.typeBadge, item.type === 'launch' ? styles.launchBadge : styles.newsBadge]}>
                  <Ionicons
                    name={item.type === 'launch' ? 'rocket-outline' : 'newspaper-outline'}
                    size={12}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.typeBadgeText}>{item.type === 'launch' ? 'Launch' : 'News'}</Text>
                </View>
                {!seen ? <View style={styles.unreadDot} /> : null}
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
              <Text style={styles.cardTime}>{formatRelativeTime(item.time)}</Text>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View>
            <Text style={styles.heroTitle}>Notification Center</Text>
            <Text style={styles.heroSubtitle}>
              Live alert stream for launch schedule shifts and publication drops.
            </Text>

            <View style={styles.counterPill}>
              <Text style={styles.counterText}>{unreadCount} unread</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            message="No new launch or editorial signals are available right now."
            onRetry={onRefresh}
            icon="notifications-off-outline"
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
    marginBottom: 12,
  },
  counterPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.36)',
    backgroundColor: 'rgba(79,209,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  counterText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    marginBottom: 10,
  },
  cardSeen: {
    opacity: 0.75,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  launchBadge: {
    borderColor: 'rgba(123,97,255,0.4)',
    backgroundColor: 'rgba(123,97,255,0.18)',
  },
  newsBadge: {
    borderColor: 'rgba(79,209,255,0.4)',
    backgroundColor: 'rgba(79,209,255,0.18)',
  },
  typeBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.danger,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 7,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  cardTime: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
