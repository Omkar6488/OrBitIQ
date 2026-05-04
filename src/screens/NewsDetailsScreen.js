import React, { useEffect, useMemo } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavbar from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatDate } from '../utils/formatDate';
import { saveRecentItem } from '../services/recentService';

export default function NewsDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const article = route?.params?.article;

  const details = useMemo(
    () => ({
      id: article?.id || article?.url || article?.title || 'unknown',
      title: article?.title || 'Untitled article',
      image: article?.image_url,
      source: article?.news_site || 'Spaceflight News',
      publishedAt: article?.published_at,
      summary: article?.summary || 'No summary available.',
      link: article?.url,
    }),
    [article]
  );

  useEffect(() => {
    saveRecentItem({
      key: `news-${details.id}`,
      title: details.title,
      itemType: 'news',
      viewedAt: Date.now(),
    });
  }, [details.id, details.title]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar title="News Brief" onLeftPress={() => navigation.goBack()} showSearch={false} showRefresh={false} />
      <ScrollView contentContainerStyle={[globalStyles.contentContainer, { paddingTop: insets.top + 90 }]}>
        <LinearGradient
          colors={['rgba(79,209,255,0.18)', 'rgba(123,97,255,0.16)', 'rgba(5,8,22,0.75)']}
          style={styles.heroCard}
        >
          {!!details.image ? (
            <Image source={{ uri: details.image }} style={styles.image} resizeMode="cover" />
          ) : null}
          <View style={styles.content}>
            <Text style={styles.source}>{details.source}</Text>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.date}>{formatDate(details.publishedAt)}</Text>
            <Text style={styles.summary}>{details.summary}</Text>

            {details.link ? (
              <Pressable style={styles.openButton} onPress={() => Linking.openURL(details.link)}>
                <Text style={styles.openButtonText}>Open Full Article</Text>
              </Pressable>
            ) : null}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: 240,
  },
  content: {
    padding: 16,
  },
  source: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  openButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.4)',
    backgroundColor: 'rgba(79,209,255,0.14)',
  },
  openButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});