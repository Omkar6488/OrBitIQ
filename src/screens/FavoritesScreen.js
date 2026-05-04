import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import LaunchCard from '../components/LaunchCard';
import NewsCard from '../components/NewsCard';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import {
  getFavoriteNewsMap,
  getFavoriteNewsList,
  getFavoritesMap,
  getFavoritesList,
  toggleFavoriteLaunch,
  toggleFavoriteNews,
} from '../services/favoritesService';

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
  const [favoriteLaunchMap, setFavoriteLaunchMap] = useState({});
  const [favoriteNewsMap, setFavoriteNewsMap] = useState({});
  const [favoriteLaunches, setFavoriteLaunches] = useState([]);
  const [favoriteNews, setFavoriteNews] = useState([]);
  const lastRefreshSignal = useRef(refreshSignal);

  const syncFavorites = useCallback(async () => {
    const [launchMap, newsMap, launches, news] = await Promise.all([
      getFavoritesMap(),
      getFavoriteNewsMap(),
      getFavoritesList(),
      getFavoriteNewsList(),
    ]);

    setFavoriteLaunchMap(launchMap);
    setFavoriteNewsMap(newsMap);
    setFavoriteLaunches(launches);
    setFavoriteNews(news);
  }, []);

  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    syncFavorites();
  }, [refreshSignal, syncFavorites]);

  const onToggleFavoriteLaunch = useCallback(async (launch) => {
    const next = await toggleFavoriteLaunch(launch);
    setFavoriteLaunchMap(next.favoritesMap);
    setFavoriteLaunches(Object.values(next.favoritesMap));
  }, []);

  const onToggleFavoriteNews = useCallback(async (article) => {
    const next = await toggleFavoriteNews(article);
    setFavoriteNewsMap(next.favoritesMap);
    setFavoriteNews(Object.values(next.favoritesMap));
  }, []);

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);
  const isLaunches = type === 'launches';
  const launchCount = favoriteLaunches.length;
  const newsCount = favoriteNews.length;

  const data = useMemo(() => (isLaunches ? favoriteLaunches : favoriteNews), [
    favoriteLaunches,
    favoriteNews,
    isLaunches,
  ]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Saved Signals"
          onSearchPress={() => navigation.navigate('Search', { initialType: isLaunches ? 'launches' : 'news' })}
          onRefreshPress={syncFavorites}
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
              launch={item}
              isFavorite={!!favoriteLaunchMap[item?.id]}
              onPress={() => navigation.navigate('LaunchDetails', { launch: item })}
              onToggleFavorite={() => onToggleFavoriteLaunch(item)}
            />
          ) : (
            <NewsCard
              article={item}
              isFavorite={!!favoriteNewsMap[item?.id || item?.url]}
              onPress={() => navigation.navigate('NewsDetails', { article: item })}
              onToggleFavorite={() => onToggleFavoriteNews(item)}
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
