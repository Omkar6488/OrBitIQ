import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import LaunchCard from '../components/LaunchCard';
import NewsCard from '../components/NewsCard';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { useAuth } from '../context/AuthContext';
import { addBookmark, deleteBookmark, getBookmarks } from '../firebase/firestore';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function FavoritesScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
  hubOnScroll,
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState('launches');
  const [bookmarkMap, setBookmarkMap] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const lastRefreshSignal = useRef(refreshSignal);
  const { currentUser } = useAuth();

  const syncBookmarks = useCallback(async () => {
    if (!currentUser?.uid) {
      setBookmarkMap({});
      setBookmarks([]);
      return;
    }

    const items = await getBookmarks(currentUser.uid);
    const nextMap = items.reduce((acc, item) => {
      const key = item?.sourceId || item?.id;
      if (key) {
        acc[key] = item;
      }
      return acc;
    }, {});
    setBookmarkMap(nextMap);
    setBookmarks(items);
  }, [currentUser?.uid]);

  useEffect(() => {
    syncBookmarks();
  }, [syncBookmarks]);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    syncBookmarks();
  }, [refreshSignal, syncBookmarks]);

  const onToggleFavoriteLaunch = useCallback(
    async (launch) => {
      if (!currentUser?.uid || !launch?.id) {
        return;
      }

      const sourceId = launch.id;
      const existing = bookmarkMap[sourceId];
      if (existing?.id) {
        await deleteBookmark(currentUser.uid, existing.id);
        return syncBookmarks();
      }

      const payload = {
        sourceId,
        title: launch?.name || 'Untitled launch',
        type: 'launch',
        timestamp: Date.now(),
        data: launch,
      };

      await addBookmark(currentUser.uid, payload);
      return syncBookmarks();
    },
    [bookmarkMap, currentUser?.uid, syncBookmarks]
  );

  const onToggleFavoriteNews = useCallback(
    async (article) => {
      if (!currentUser?.uid) {
        return;
      }

      const sourceId = article?.id || article?.url;
      if (!sourceId) {
        return;
      }

      const existing = bookmarkMap[sourceId];
      if (existing?.id) {
        await deleteBookmark(currentUser.uid, existing.id);
        return syncBookmarks();
      }

      const payload = {
        sourceId,
        title: article?.title || 'Untitled article',
        type: 'news',
        timestamp: Date.now(),
        data: article,
      };

      await addBookmark(currentUser.uid, payload);
      return syncBookmarks();
    },
    [bookmarkMap, currentUser?.uid, syncBookmarks]
  );

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);
  const isLaunches = type === 'launches';
  const launchCount = bookmarks.filter((item) => item?.type === 'launch').length;
  const newsCount = bookmarks.filter((item) => item?.type === 'news').length;

  const data = useMemo(
    () => bookmarks.filter((item) => (isLaunches ? item?.type === 'launch' : item?.type === 'news')),
    [bookmarks, isLaunches]
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Saved Signals"
          onSearchPress={() => navigation.navigate('Search', { initialType: isLaunches ? 'launches' : 'news' })}
          onRefreshPress={syncBookmarks}
        />
      ) : null}

      <AnimatedFlatList
        data={data}
        keyExtractor={(item, index) => `${item?.id || item?.url || 'favorite'}-${index}`}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        renderItem={({ item }) =>
          isLaunches ? (
            <LaunchCard
              launch={item?.data}
              isFavorite={!!bookmarkMap[item?.sourceId]}
              onPress={() => navigation.navigate('LaunchDetails', { launch: item?.data })}
              onToggleFavorite={() => onToggleFavoriteLaunch(item?.data)}
            />
          ) : (
            <NewsCard
              article={item?.data}
              isFavorite={!!bookmarkMap[item?.sourceId]}
              onPress={() => navigation.navigate('NewsDetails', { article: item?.data })}
              onToggleFavorite={() => onToggleFavoriteNews(item?.data)}
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.heroTitle}>Favorites</Text>
            <Text style={styles.heroSubtitle}>Saved launches and articles for instant mission recall.</Text>

            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggle, isLaunches && styles.toggleActive]}
                onPress={() => setType('launches')}
              >
                <Text style={[styles.toggleText, isLaunches && styles.toggleTextActive]}>
                  Launches ({launchCount})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggle, !isLaunches && styles.toggleActive]}
                onPress={() => setType('news')}
              >
                <Text style={[styles.toggleText, !isLaunches && styles.toggleTextActive]}>News ({newsCount})</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={isLaunches ? 'No launch favorites yet' : 'No news favorites yet'}
            message={
              isLaunches
                ? 'Star launches from Launch Console to keep them here.'
                : 'Star stories from Feed to keep critical updates saved.'
            }
            icon="star-outline"
          />
        }
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={6}
        maxToRenderPerBatch={5}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: 6,
  },
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
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleActive: {
    borderColor: 'rgba(79,209,255,0.45)',
    backgroundColor: 'rgba(79,209,255,0.16)',
  },
  toggleText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
});
