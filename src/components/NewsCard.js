import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/formatDate';
import { colors } from '../styles/colors';
import InfoChip from './InfoChip';

function NewsCard({ article, onPress, isFavorite = false, onToggleFavorite }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View style={styles.card}>
        {!!article?.image_url && <Image source={{ uri: article.image_url }} style={styles.image} />}
        <View style={styles.content}>
          <View style={styles.headRow}>
            <InfoChip label={article?.news_site || 'SPACE NEWS'} />
            {!!onToggleFavorite && (
              <Pressable
                onPress={(event) => {
                  event?.stopPropagation?.();
                  onToggleFavorite();
                }}
                style={styles.favoriteButton}
              >
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={18}
                  color={isFavorite ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {article?.title || 'Untitled article'}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {article?.summary || 'No summary available.'}
          </Text>
          <Text style={styles.date}>{formatDate(article?.published_at)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(NewsCard);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: 170,
  },
  content: {
    padding: 14,
    gap: 8,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 21,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
