import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LaunchCard from '../components/LaunchCard';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import SearchInput from '../components/SearchInput';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import useFetch from '../hooks/useFetch';
import { getSpaceNews, getUpcomingLaunches } from '../api/api';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { LIST_LIMIT, SEARCH_MIN_CHARS } from '../utils/constants';
import { searchLaunches, searchNews } from '../services/searchService';
import { useAuth } from '../context/AuthContext';
import { addBookmark, deleteBookmark, getBookmarks } from '../firebase/firestore';

export default function SearchScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [type, setType] = useState(route?.params?.initialType || 'launches');
  const [bookmarksMap, setBookmarksMap] = useState({});
  const { currentUser } = useAuth();

  const fetchLaunches = useCallback(() => getUpcomingLaunches({ limit: LIST_LIMIT }), []);
  const fetchNews = useCallback(() => getSpaceNews({ limit: LIST_LIMIT, ordering: '-published_at' }), []);

  const { data: launchesData, loading: launchesLoading } = useFetch(fetchLaunches, {
    initialData: { results: [] },
  });
  const { data: newsData, loading: newsLoading } = useFetch(fetchNews, {
    initialData: { results: [] },
  });

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

  const launches = useMemo(() => launchesData?.results || [], [launchesData]);
  const news = useMemo(() => newsData?.results || [], [newsData]);

  const filteredLaunches = useMemo(() => searchLaunches(launches, query), [launches, query]);
  const filteredNews = useMemo(() => searchNews(news, query), [news, query]);

  const onToggleFavoriteLaunch = useCallback(
    async (launch) => {
      if (!currentUser?.uid || !launch?.id) {
        return;
      }

      const sourceId = launch.id;
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
        title: launch?.name || 'Untitled launch',
        type: 'launch',
        timestamp: Date.now(),
        data: launch,
      };

      const docRef = await addBookmark(currentUser.uid, payload);
      setBookmarksMap((current) => ({
        ...current,
        [sourceId]: { id: docRef.id, ...payload },
      }));
    },
    [bookmarksMap, currentUser?.uid]
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
        title: article?.title || 'Untitled article',
        type: 'news',
        timestamp: Date.now(),
        data: article,
      };

      const docRef = await addBookmark(currentUser.uid, payload);
      setBookmarksMap((current) => ({
        ...current,
        [sourceId]: { id: docRef.id, ...payload },
      }));
    },
    [bookmarksMap, currentUser?.uid]
  );

  const openLaunchDetails = useCallback(
    (launch) => navigation.navigate('LaunchDetails', { launch }),
    [navigation]
  );

  const openNewsDetails = useCallback(
    (article) => navigation.navigate('NewsDetails', { article }),
    [navigation]
  );

  const isTyping = query.trim().length >= SEARCH_MIN_CHARS;
  const topPadding = getNavbarContentOffset(insets);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar
        title="Search"
        onLeftPress={() => navigation.goBack()}
        showSearch={false}
        showRefresh={false}
      />

      <View style={[globalStyles.contentContainer, styles.controlsWrap, { paddingTop: topPadding }]}> 
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            type === 'launches'
              ? 'Search launches, providers, orbits...'
              : 'Search news title, source, summary...'
          }
        />

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, type === 'launches' && styles.toggleActive]}
            onPress={() => setType('launches')}
          >
            <Text style={[styles.toggleText, type === 'launches' && styles.toggleTextActive]}>Launches</Text>
          </Pressable>
          <Pressable style={[styles.toggle, type === 'news' && styles.toggleActive]} onPress={() => setType('news')}>
            <Text style={[styles.toggleText, type === 'news' && styles.toggleTextActive]}>News</Text>
          </Pressable>
        </View>

        {!isTyping ? (
          <Text style={styles.hint}>Type at least {SEARCH_MIN_CHARS} characters to filter results.</Text>
        ) : null}
      </View>

      {type === 'launches' ? (
        launchesLoading ? (
          <View style={styles.loaderWrap}>
            <Loader count={3} height={210} />
          </View>
        ) : (
          <FlatList
            data={isTyping ? filteredLaunches : launches}
            keyExtractor={(item, index) => `${item?.id || 'search-launch'}-${index}`}
            renderItem={({ item }) => (
              <LaunchCard
                launch={item}
                isFavorite={!!bookmarksMap[item?.id]}
                onPress={() => openLaunchDetails(item)}
                onToggleFavorite={() => onToggleFavoriteLaunch(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : newsLoading ? (
        <View style={styles.loaderWrap}>
          <Loader count={3} height={210} />
        </View>
      ) : (
        <FlatList
          data={isTyping ? filteredNews : news}
          keyExtractor={(item, index) => `${item?.id || item?.url || 'search-news'}-${index}`}
          renderItem={({ item }) => (
            <NewsCard
              article={item}
              isFavorite={!!bookmarksMap[item?.id || item?.url]}
              onPress={() => openNewsDetails(item)}
              onToggleFavorite={() => onToggleFavoriteNews(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controlsWrap: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  toggleActive: {
    borderColor: 'rgba(79,209,255,0.45)',
    backgroundColor: 'rgba(79,209,255,0.16)',
  },
  toggleText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  loaderWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
