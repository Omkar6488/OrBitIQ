import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavbar from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { STORAGE_KEYS } from '../utils/constants';
import { formatDate } from '../utils/formatDate';

export default function DetailsScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { itemType, item } = route.params || {};

  const details = useMemo(() => {
    if (!item) {
      return {
        id: 'unknown',
        title: 'No data available',
        image: null,
        description: 'The selected item does not contain details.',
        metadata: [],
      };
    }

    if (itemType === 'launch') {
      return {
        id: item.id || item.name,
        title: item.name || 'Untitled mission',
        image: item.image,
        description:
          item?.mission?.description ||
          item?.status?.description ||
          'Detailed mission briefing is not available for this launch.',
        metadata: [
          { label: 'Rocket', value: item?.rocket?.configuration?.full_name || 'Unknown' },
          { label: 'Window', value: formatDate(item?.net) },
          { label: 'Provider', value: item?.launch_service_provider?.name || 'Unknown' },
        ],
      };
    }

    return {
      id: item.id || item.url || item.title,
      title: item.title || 'Untitled update',
      image: item.image_url,
      description: item.summary || item.explanation || 'No extended summary available.',
      metadata: [
        { label: 'Published', value: formatDate(item.published_at || item.date) },
        { label: 'Source', value: item?.news_site || 'Spaceflight News' },
      ],
    };
  }, [item, itemType]);

  useEffect(() => {
    const saveRecentlyViewed = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_ITEMS);
        const parsed = raw ? JSON.parse(raw) : [];
        const key = `${itemType || 'item'}-${details.id}`;

        const next = [
          {
            key,
            itemType: itemType || 'unknown',
            title: details.title,
            viewedAt: Date.now(),
          },
          ...parsed.filter((entry) => entry.key !== key),
        ].slice(0, 25);

        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_ITEMS, JSON.stringify(next));
      } catch (storageError) {
        // Recent history is non-blocking for details rendering.
      }
    };

    saveRecentlyViewed();
  }, [details.id, details.title, itemType]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar title="Details" showSearch={false} showRefresh={false} />
      <ScrollView
        contentContainerStyle={[globalStyles.contentContainer, { paddingTop: insets.top + 90 }]}
        showsVerticalScrollIndicator={false}
      >

        <LinearGradient
          colors={['rgba(47,140,255,0.22)', 'rgba(122,107,255,0.2)', 'rgba(11,15,26,0.5)']}
          style={styles.heroCard}
        >
          {!!details.image ? (
            <Image source={{ uri: details.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{details.title}</Text>

            <View style={styles.metaContainer}>
              {details.metadata.map((meta) => (
                <View key={`${meta.label}-${meta.value}`} style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>{meta.label}</Text>
                  <Text style={styles.metaValue}>{meta.value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.description}>{details.description}</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 260,
  },
  placeholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  content: {
    padding: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  metaContainer: {
    marginTop: 14,
    marginBottom: 6,
    gap: 10,
  },
  metaBlock: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    padding: 10,
    backgroundColor: 'rgba(11,15,26,0.3)',
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  metaValue: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    marginTop: 12,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 15,
  },
});
