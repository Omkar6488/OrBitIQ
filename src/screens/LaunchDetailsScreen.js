import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CountdownTimer from '../components/CountdownTimer';
import TopNavbar from '../components/TopNavbar';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';
import { formatDate, formatRelativeTime } from '../utils/formatDate';
import { saveRecentItem } from '../services/recentService';

export default function LaunchDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const launch = route?.params?.launch;

  const details = useMemo(() => {
    const mission = launch?.mission || {};
    const pad = launch?.pad || {};

    return {
      id: launch?.id || launch?.name || 'unknown',
      name: launch?.name || 'Untitled mission',
      image: launch?.image,
      description:
        mission?.description ||
        launch?.status?.description ||
        'Detailed mission narrative is unavailable for this launch.',
      provider: launch?.launch_service_provider?.name || 'Unknown provider',
      rocket: launch?.rocket?.configuration?.full_name || 'Unknown rocket',
      location: pad?.location?.name || 'Unknown location',
      orbit: mission?.orbit?.name || 'Unknown orbit',
      status: launch?.status?.name || 'Pending',
      window: launch?.window_start || launch?.net,
      net: launch?.net,
      weather: launch?.weather_concerns || 'No weather concerns reported',
    };
  }, [launch]);

  useEffect(() => {
    saveRecentItem({
      key: `launch-${details.id}`,
      title: details.name,
      itemType: 'launch',
      viewedAt: Date.now(),
    });
  }, [details.id, details.name]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar title="Mission Dossier" onLeftPress={() => navigation.goBack()} showSearch={false} showRefresh={false} />
      <ScrollView contentContainerStyle={[globalStyles.contentContainer, { paddingTop: insets.top + 90 }]}>
        <LinearGradient
          colors={['rgba(79,209,255,0.2)', 'rgba(123,97,255,0.2)', 'rgba(5,8,22,0.75)']}
          style={styles.heroCard}
        >
          {!!details.image ? (
            <Image source={{ uri: details.image }} style={styles.image} resizeMode="cover" />
          ) : null}
          <View style={styles.content}>
            <Text style={styles.title}>{details.name}</Text>
            <Text style={styles.subtitle}>{details.status}</Text>
            <Text style={styles.description}>{details.description}</Text>
            <CountdownTimer targetDate={details.net} />
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mission Brief</Text>
          <Text style={styles.metaLine}>Rocket: {details.rocket}</Text>
          <Text style={styles.metaLine}>Provider: {details.provider}</Text>
          <Text style={styles.metaLine}>Location: {details.location}</Text>
          <Text style={styles.metaLine}>Orbit: {details.orbit}</Text>
          <Text style={styles.metaLine}>Window: {formatDate(details.window)}</Text>
          <Text style={styles.metaLine}>Relative: {formatRelativeTime(details.net)}</Text>
          <Text style={styles.metaLine}>Weather: {details.weather}</Text>
        </View>
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
    marginBottom: 16,
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: 240,
  },
  content: {
    padding: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: colors.card,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaLine: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});