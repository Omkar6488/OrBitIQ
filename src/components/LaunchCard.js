import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountdownTimer from './CountdownTimer';
import { formatDate } from '../utils/formatDate';
import { colors } from '../styles/colors';
import InfoChip from './InfoChip';

const getStatusTone = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('go') || normalized.includes('success')) {
    return 'success';
  }
  if (normalized.includes('delay') || normalized.includes('hold')) {
    return 'warning';
  }
  if (normalized.includes('fail') || normalized.includes('abort')) {
    return 'danger';
  }

  return 'default';
};

function LaunchCard({ launch, onPress, isFavorite, onToggleFavorite }) {
  const missionName = launch?.name || 'Untitled mission';
  const rocketName = launch?.rocket?.configuration?.full_name || 'Unknown rocket';
  const provider = launch?.launch_service_provider?.name || 'Unknown provider';
  const location = launch?.pad?.location?.name || 'Unknown location';
  const orbit = launch?.mission?.orbit?.name || 'Unknown orbit';
  const status = launch?.status?.name || 'Pending';
  const launchDate = launch?.net;
  const launchImage = launch?.image;

  return (
    <Pressable
      style={({ pressed }) => [styles.touchable, pressed && styles.pressedCard]}
      onPress={onPress}
    >
      <View style={styles.blurCard}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <InfoChip label={status} tone={getStatusTone(status)} />
            <Text style={styles.title} numberOfLines={2}>
              {missionName}
            </Text>
          </View>
          <Pressable
            style={styles.favoriteButton}
            onPress={(event) => {
              event?.stopPropagation?.();
              onToggleFavorite();
            }}
            hitSlop={10}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={isFavorite ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>

        {!!launchImage && <Image source={{ uri: launchImage }} style={styles.image} resizeMode="cover" />}

        <Text style={styles.rocket}>{rocketName}</Text>
        <Text style={styles.date}>{formatDate(launchDate)}</Text>

        <View style={styles.metaGrid}>
          <Text style={styles.metaText}>Provider: {provider}</Text>
          <Text style={styles.metaText}>Location: {location}</Text>
          <Text style={styles.metaText}>Orbit: {orbit}</Text>
        </View>

        <CountdownTimer targetDate={launchDate} />
      </View>
    </Pressable>
  );
}

export default memo(LaunchCard);

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 14,
  },
  pressedCard: {
    transform: [{ scale: 0.985 }],
  },
  blurCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 14,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topLeft: {
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,26,0.45)',
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    marginBottom: 10,
  },
  rocket: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  date: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
  },
  metaGrid: {
    marginTop: 10,
    gap: 4,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
