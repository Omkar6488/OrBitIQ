import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNasaApod, getSpaceNews } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import useFetch from '../hooks/useFetch';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { LIST_LIMIT } from '../utils/constants';
import { getFavoriteNewsMap, toggleFavoriteNews } from '../services/favoritesService';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const sortByPublishedDate = (items) => {
  return [...items].sort(
    (a, b) => new Date(b?.published_at || 0).getTime() - new Date(a?.published_at || 0).getTime()
  );
};

export default function HomeScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
  hubOnScroll,
}) {
  const insets = useSafeAreaInsets();
  const [newsItems, setNewsItems] = useState([]);
  const [favoriteNewsMap, setFavoriteNewsMap] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const lastRefreshSignal = useRef(refreshSignal);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const fetchApod = useCallback(() => getNasaApod({ api_key: 'DEMO_KEY' }), []);

  const {
    data: apod,
    loading: apodLoading,
    refetch: refetchApod,
  } = useFetch(fetchApod);

  const loadNewsPage = useCallback(
    async ({ nextOffset = 0, reset = false } = {}) => {
      if (reset) {
        setNewsItems([]);
        setHasMore(true);
      }

      if (nextOffset === 0 && !reset) {
        setLoadingInitial(true);
      }

      if (nextOffset > 0) {
        setLoadingMore(true);
      }

      try {
        const response = await getSpaceNews({
          limit: LIST_LIMIT,
          offset: nextOffset,
          ordering: '-published_at',
        });

        const incoming = Array.isArray(response?.results) ? response.results : [];

        setNewsItems((current) => {
          const seed = reset ? [] : current;
          const mergedMap = new Map();

          [...seed, ...incoming].forEach((item) => {
            const key = item?.id || item?.url || `${item?.title || 'article'}-${item?.published_at || ''}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, item);
            }
          });

          return sortByPublishedDate(Array.from(mergedMap.values()));
        });

        const receivedCount = incoming.length;
        const reachedEnd = receivedCount < LIST_LIMIT;
        setHasMore(!reachedEnd);
        setOffset(nextOffset + receivedCount);
        setNewsError(null);
      } catch (error) {
        setNewsError(error);
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  useEffect(() => {
    loadNewsPage({ nextOffset: 0, reset: true });
    getFavoriteNewsMap().then(setFavoriteNewsMap);
  }, [loadNewsPage]);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    setRefreshing(true);
    Promise.all([loadNewsPage({ nextOffset: 0, reset: true }), refetchApod()]).finally(() => {
      setRefreshing(false);
    });
  }, [loadNewsPage, refreshSignal, refetchApod]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadNewsPage({ nextOffset: 0, reset: true }), refetchApod()]).finally(() => {
      setRefreshing(false);
    });
  }, [loadNewsPage, refetchApod]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || loadingInitial || refreshing || !hasMore) {
      return;
    }

    loadNewsPage({ nextOffset: offset, reset: false });
  }, [hasMore, loadNewsPage, loadingInitial, loadingMore, offset, refreshing]);

  const openNewsDetails = useCallback(
    (article) => {
      navigation.navigate('NewsDetails', { article });
    },
    [navigation]
  );

  const toggleNewsFavorite = useCallback(async (article) => {
    const next = await toggleFavoriteNews(article);
    setFavoriteNewsMap(next.favoritesMap);
  }, []);

  const openApodDetails = useCallback(() => {
    if (!apod) {
      return;
    }

    navigation.navigate('NewsDetails', {
      article: {
        id: `apod-${apod.date}`,
        title: apod.title,
        image_url: apod.url,
        summary: apod.explanation,
        published_at: apod.date,
        news_site: 'NASA APOD',
        url: apod?.hdurl || apod?.url,
      },
    });
  }, [apod, navigation]);

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);
  const apodSource = apod?.__source || 'network';
  const trending = useMemo(() => newsItems.slice(0, 3), [newsItems]);

  const renderItem = useCallback(
    ({ item }) => {
      const key = item?.id || item?.url;
      return (
        <NewsCard
          article={item}
          onPress={() => openNewsDetails(item)}
          isFavorite={!!favoriteNewsMap[key]}
          onToggleFavorite={() => toggleNewsFavorite(item)}
        />
      );
    },
    [favoriteNewsMap, openNewsDetails, toggleNewsFavorite]
  );

  const listHeader = useMemo(
    () => (
      <Animated.View style={[styles.headerContainer, { opacity: fadeIn }]}> 
        <Text style={styles.heroTitle}>Intelligence Feed</Text>
        <Text style={styles.heroSubtitle}>Real-time orbital journalism and deep-space briefings.</Text>

        {apodLoading && !apod ? <Loader count={1} height={238} /> : null}

        {!!apod && (
          <Pressable style={styles.featuredPressable} onPress={openApodDetails}>
            <LinearGradient
              colors={['rgba(50, 208, 255, 0.22)', 'rgba(123, 97, 255, 0.28)', 'rgba(7, 12, 28, 0.8)']}
              style={styles.featuredCard}
            >
              {!!apod.url && <Image source={{ uri: apod.url }} style={styles.featuredImage} />}
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTag}>NASA APOD</Text>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {apod.title}
                </Text>
                <Text style={styles.featuredDescription} numberOfLines={3}>
                  {apod.explanation}
                </Text>
                {apodSource !== 'network' ? (
                  <Text style={styles.fallbackPill}>
                    {apodSource === 'cache' ? 'Showing cached APOD' : 'Showing curated fallback'}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {!!trending.length && (
          <View style={styles.trendingWrap}>
            <Text style={styles.trendingTitle}>Trending</Text>
            <FlatList
              horizontal
              data={trending}
              keyExtractor={(item, index) => `${item?.id || item?.url || 'trend'}-${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              renderItem={({ item }) => (
                <Pressable style={styles.trendingPill} onPress={() => openNewsDetails(item)}>
                  <Text style={styles.trendingPillText} numberOfLines={1}>
                    {item?.title || 'Untitled'}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        <Text style={[globalStyles.sectionTitle, styles.sectionTitle]}>Latest Space News</Text>
      </Animated.View>
    ),
    [apod, apodLoading, apodSource, fadeIn, openApodDetails, openNewsDetails, trending]
  );

  if (loadingInitial && newsItems.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Intelligence Feed"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'news' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}>
          <Loader count={3} height={210} />
        </View>
      </SafeAreaView>
    );
  }

  if (newsError && newsItems.length === 0 && !loadingInitial) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
        {!embedded ? (
          <TopNavbar
            title="Intelligence Feed"
            onSearchPress={() => navigation.navigate('Search', { initialType: 'news' })}
            onRefreshPress={onRefresh}
          />
        ) : null}
        <View style={[globalStyles.contentContainer, { paddingTop: topPadding }]}> 
          <EmptyState
            title="News feed unavailable"
            message="Check your connection and retry."
            onRetry={() => loadNewsPage({ nextOffset: 0, reset: true })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Intelligence Feed"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'news' })}
          onRefreshPress={onRefresh}
        />
      ) : null}
      <AnimatedFlatList
        data={newsItems}
        keyExtractor={(item, index) => `${item?.id || item?.url || 'news'}-${index}`}
        renderItem={renderItem}
        onScroll={embedded ? hubOnScroll : undefined}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loadingInitial ? (
            <EmptyState
              title="No stories right now"
              message="There are no fresh articles yet. Pull to refresh in a moment."
              onRetry={() => loadNewsPage({ nextOffset: 0, reset: true })}
              icon="newspaper-outline"
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? <Loader count={1} height={150} /> : null}
        onEndReachedThreshold={0.28}
        onEndReached={onLoadMore}
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        initialNumToRender={6}
        windowSize={7}
        maxToRenderPerBatch={6}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
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
    marginBottom: 18,
  },
  featuredPressable: {
    marginBottom: 18,
  },
  featuredCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 214,
  },
  featuredContent: {
    padding: 14,
  },
  featuredTag: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  featuredTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  featuredDescription: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  fallbackPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  trendingWrap: {
    marginBottom: 14,
  },
  trendingTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  trendingList: {
    gap: 8,
    paddingRight: 4,
  },
  trendingPill: {
    maxWidth: 220,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.35)',
    backgroundColor: 'rgba(79,209,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trendingPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    marginBottom: 12,
  },
});
