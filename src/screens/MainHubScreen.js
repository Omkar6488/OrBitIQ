import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavbar, { getNavbarContentOffset, NAVBAR_HEIGHT } from '../components/TopNavbar';
import TopTabSwitcher, { TAB_SWITCHER_HEIGHT } from '../components/TopTabSwitcher';
import HomeScreen from './HomeScreen';
import LaunchesScreen from './LaunchesScreen';
import MissionsScreen from './MissionsScreen';
import VehiclesScreen from './VehiclesScreen';
import MapScreen from './MapScreen';
import FavoritesScreen from './FavoritesScreen';
import globalStyles from '../styles/globalStyles';

const HUB_TABS = [
  { key: 'feed', label: 'Feed', title: 'Intelligence Feed' },
  { key: 'launches', label: 'Launches', title: 'Launch Console' },
  { key: 'missions', label: 'Missions', title: 'Mission Intelligence' },
  { key: 'vehicles', label: 'Vehicles', title: 'Vehicle Registry' },
  { key: 'map', label: 'Map', title: 'ISS Tracker' },
  { key: 'favorites', label: 'Favorites', title: 'Saved Signals' },
];

const NAV_SCROLL_DISTANCE = NAVBAR_HEIGHT + 12;

export default function MainHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('feed');
  const [refreshSignal, setRefreshSignal] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const clampedScroll = useMemo(
    () => Animated.diffClamp(scrollY, 0, NAV_SCROLL_DISTANCE),
    [scrollY]
  );

  const navbarAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: clampedScroll.interpolate({
            inputRange: [0, NAV_SCROLL_DISTANCE],
            outputRange: [0, -NAV_SCROLL_DISTANCE],
            extrapolate: 'clamp',
          }),
        },
      ],
      opacity: clampedScroll.interpolate({
        inputRange: [0, NAV_SCROLL_DISTANCE],
        outputRange: [1, 0.84],
        extrapolate: 'clamp',
      }),
    }),
    [clampedScroll]
  );

  const tabAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: clampedScroll.interpolate({
            inputRange: [0, NAV_SCROLL_DISTANCE],
            outputRange: [0, -NAV_SCROLL_DISTANCE],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [clampedScroll]
  );

  const hubOnScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      ),
    [scrollY]
  );

  const activeTabMeta = useMemo(
    () => HUB_TABS.find((tab) => tab.key === activeTab) || HUB_TABS[0],
    [activeTab]
  );

  const contentTopPadding = useMemo(
    () => getNavbarContentOffset(insets) + TAB_SWITCHER_HEIGHT + 8,
    [insets]
  );

  const searchType = activeTab === 'feed' ? 'news' : 'launches';

  const onRefreshPress = () => {
    setRefreshSignal((current) => current + 1);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#060A1D', '#080D24', '#040611']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.ambientOrbA} />
        <View pointerEvents="none" style={styles.ambientOrbB} />

        <TopNavbar
          title={activeTabMeta.title}
          onSearchPress={() => navigation.navigate('Search', { initialType: searchType })}
          onNotifyPress={() => navigation.navigate('Notifications')}
          showNotifyBadge
          showSearch
          showNotify
          animatedStyle={navbarAnimatedStyle}
        />

        <TopTabSwitcher
          tabs={HUB_TABS}
          activeKey={activeTab}
          onSelect={setActiveTab}
          topOffset={getNavbarContentOffset(insets)}
          animatedStyle={tabAnimatedStyle}
        />

        {activeTab === 'feed' ? (
          <HomeScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

        {activeTab === 'launches' ? (
          <LaunchesScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

        {activeTab === 'missions' ? (
          <MissionsScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

        {activeTab === 'vehicles' ? (
          <VehiclesScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

        {activeTab === 'map' ? (
          <MapScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

        {activeTab === 'favorites' ? (
          <FavoritesScreen
            navigation={navigation}
            embedded
            contentTopPadding={contentTopPadding}
            refreshSignal={refreshSignal}
            hubOnScroll={hubOnScroll}
          />
        ) : null}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientOrbA: {
    position: 'absolute',
    top: 90,
    right: -58,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(79, 209, 255, 0.17)',
  },
  ambientOrbB: {
    position: 'absolute',
    top: 260,
    left: -82,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(123, 97, 255, 0.18)',
  },
});
