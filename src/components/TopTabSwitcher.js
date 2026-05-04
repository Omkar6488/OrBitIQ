import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

export const TAB_SWITCHER_HEIGHT = 54;

export default function TopTabSwitcher({ tabs, activeKey, onSelect, topOffset = 0, animatedStyle }) {
  const animationMapRef = useRef({});

  useEffect(() => {
    tabs.forEach((tab) => {
      if (!animationMapRef.current[tab.key]) {
        animationMapRef.current[tab.key] = new Animated.Value(tab.key === activeKey ? 1 : 0);
      }
    });
  }, [activeKey, tabs]);

  useEffect(() => {
    tabs.forEach((tab) => {
      const toValue = tab.key === activeKey ? 1 : 0;
      Animated.spring(animationMapRef.current[tab.key], {
        toValue,
        useNativeDriver: true,
        speed: 16,
        bounciness: 6,
      }).start();
    });
  }, [activeKey, tabs]);

  return (
    <Animated.View style={[styles.wrapper, { top: topOffset }, animatedStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const animated = animationMapRef.current[tab.key] || new Animated.Value(0);
          const scale = animated.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.04],
          });

          const activeOpacity = animated.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <Pressable key={tab.key} onPress={() => onSelect(tab.key)} style={styles.tabHit}>
              <Animated.View style={[styles.tabBase, { transform: [{ scale }] }]}>
                <Animated.View style={[styles.activeLayer, { opacity: activeOpacity }]}> 
                  <LinearGradient
                    colors={['rgba(79,209,255,0.38)', 'rgba(123,97,255,0.34)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
                <Text style={[styles.tabLabel, tab.key === activeKey && styles.tabLabelActive]}>{tab.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  tabHit: {
    paddingVertical: 4,
  },
  tabBase: {
    minWidth: 94,
    height: TAB_SWITCHER_HEIGHT - 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  activeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
});
