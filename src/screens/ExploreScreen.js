import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNasaApod } from '../api/api';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import TopNavbar, { getNavbarContentOffset } from '../components/TopNavbar';
import useFetch from '../hooks/useFetch';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { EXPLORE_MISSIONS, EXPLORE_PLANETS } from '../utils/constants';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ExploreScreen({
  navigation,
  embedded = false,
  contentTopPadding = 0,
  refreshSignal = 0,
}) {
  const insets = useSafeAreaInsets();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastRefreshSignal = useRef(refreshSignal);

  const fetchApod = useCallback(() => getNasaApod({ api_key: 'DEMO_KEY' }), []);
  const {
    data: apod,
    loading,
    error,
    refetch,
  } = useFetch(fetchApod);

  const sections = useMemo(
    () => [
      ...EXPLORE_PLANETS.map((item) => ({ ...item, category: 'Planets' })),
      ...EXPLORE_MISSIONS.map((item) => ({ ...item, category: 'Missions' })),
    ],
    []
  );

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 680,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  useEffect(() => {
    if (refreshSignal === lastRefreshSignal.current) {
      return;
    }

    lastRefreshSignal.current = refreshSignal;
    refetch();
  }, [refetch, refreshSignal]);

  const openApodDetails = useCallback(() => {
    if (!apod) {
      return;
    }

    navigation.navigate('NewsDetails', {
      article: {
        id: `explore-apod-${apod.date}`,
        title: apod.title,
        image_url: apod.url,
        summary: apod.explanation,
        published_at: apod.date,
        news_site: 'NASA APOD',
        url: apod?.hdurl || apod?.url,
      },
    });
  }, [apod, navigation]);

  const renderSectionItem = useCallback(
    ({ item, index }) => {
      const inputRange = [Math.max(0, (index - 1) * 160), index * 160, (index + 1) * 160];

      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.96, 1, 0.96],
        extrapolate: 'clamp',
      });

      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.55, 1, 0.55],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View style={[styles.exploreCard, { transform: [{ scale }], opacity }]}> 
          <LinearGradient
            colors={['rgba(47,140,255,0.2)', 'rgba(122,107,255,0.24)', 'rgba(11,15,26,0.3)']}
            style={styles.exploreGradient}
          >
            <Text style={styles.category}>{item.category.toUpperCase()}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </LinearGradient>
        </Animated.View>
      );
    },
    [scrollY]
  );

  const topPadding = embedded ? contentTopPadding : getNavbarContentOffset(insets);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="Deep Explore"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'news' })}
          onRefreshPress={refetch}
        />
      ) : null}

      <AnimatedFlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderSectionItem}
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: topPadding }]}
        ListHeaderComponent={
          <Animated.View style={{ opacity: fadeIn }}>
            <Text style={styles.heroTitle}>Deep Explore</Text>
            <Text style={styles.heroSubtitle}>Planetary systems, mission dossiers, and cosmic discovery streams.</Text>

            {loading && !apod ? <Loader count={1} height={240} /> : null}

            {!!apod && (
              <Pressable onPress={openApodDetails} style={styles.heroPressable}>
                <LinearGradient
                  colors={['rgba(50,240,255,0.14)', 'rgba(122,107,255,0.3)']}
                  style={styles.heroCard}
                >
                  {!!apod.url && <Image source={{ uri: apod.url }} style={styles.heroImage} />}
                  <View style={styles.heroContent}>
                    <Text style={styles.heroTag}>IMAGE OF THE DAY</Text>
                    <Text style={styles.heroCardTitle}>{apod.title}</Text>
                    <Text style={styles.heroDescription} numberOfLines={3}>
                      {apod.explanation}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            )}

            {error && !apod ? (
              <EmptyState
                title="Cannot load APOD"
                message="NASA feed is currently unavailable."
                onRetry={refetch}
              />
            ) : null}

            <Text style={[globalStyles.sectionTitle, styles.sectionLabel]}>Explore Signals</Text>
          </Animated.View>
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={6}
        maxToRenderPerBatch={4}
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
    marginBottom: 18,
  },
  heroPressable: {
    marginBottom: 18,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroContent: {
    padding: 14,
  },
  heroTag: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroCardTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
  },
  heroDescription: {
    marginTop: 8,
    color: colors.textSecondary,
    lineHeight: 18,
    fontSize: 13,
  },
  sectionLabel: {
    marginBottom: 14,
  },
  exploreCard: {
    marginBottom: 12,
  },
  exploreGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 16,
  },
  category: {
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  cardDescription: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
