import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';

export const NAVBAR_HEIGHT = 70;
const NAVBAR_MARGIN_TOP = 8;
const NAVBAR_GAP = 12;

export function getNavbarContentOffset(insets) {
  return insets.top + NAVBAR_MARGIN_TOP + NAVBAR_HEIGHT + NAVBAR_GAP;
}

export default function TopNavbar({
  brand = 'OrbitIQ',
  title,
  onLeftPress,
  leftIcon = 'chevron-back',
  onSearchPress,
  onNotifyPress,
  notifyIcon = 'notifications-outline',
  onRefreshPress,
  showSearch = true,
  showNotify,
  showRefresh = true,
  showNotifyBadge = false,
  glow = true,
  animatedStyle,
}) {
  const insets = useSafeAreaInsets();
  const resolvedShowNotify = typeof showNotify === 'boolean' ? showNotify : showRefresh;
  const resolvedSecondaryPress = onNotifyPress || onRefreshPress;
  const resolvedSecondaryIcon = onNotifyPress ? notifyIcon : 'refresh-outline';

  return (
    <Animated.View style={[styles.wrapper, { top: insets.top + NAVBAR_MARGIN_TOP }, animatedStyle]}>
      {Platform.OS === 'ios' ? <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} /> : null}
      <LinearGradient
        colors={['rgba(20, 33, 75, 0.58)', 'rgba(7, 12, 28, 0.82)', 'rgba(7, 12, 28, 0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.leftSection}>
        {onLeftPress ? (
          <Pressable style={styles.iconButton} onPress={onLeftPress}>
            <Ionicons name={leftIcon} size={20} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.brandWrap}>
            <View style={styles.dot} />
            <Text style={styles.brand} numberOfLines={1}>
              {brand}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.centerSection}>
        {!!title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {showSearch ? (
          <Pressable style={styles.iconButton} onPress={onSearchPress}>
            <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : null}

        {resolvedShowNotify ? (
          <Pressable style={styles.iconButton} onPress={resolvedSecondaryPress}>
            <Ionicons name={resolvedSecondaryIcon} size={20} color={colors.textPrimary} />
            {showNotifyBadge ? <View style={styles.notifyDot} /> : null}
          </Pressable>
        ) : null}

        {!showSearch && !resolvedShowNotify ? <View style={styles.iconPlaceholder} /> : null}
      </View>

      {glow && (
        <View pointerEvents="none" style={styles.glowLayer}>
          <LinearGradient
            colors={['rgba(79, 209, 255, 0.18)', 'rgba(123, 97, 255, 0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowPill}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: NAVBAR_HEIGHT,
    zIndex: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: '#0A1030',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 124,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 124,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconPlaceholder: {
    width: 34,
    height: 34,
  },
  notifyDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#FF5A7D',
    borderWidth: 1,
    borderColor: 'rgba(7,12,28,0.9)',
  },
  glowLayer: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  glowPill: {
    width: '76%',
    height: 40,
    borderRadius: 999,
  },
});