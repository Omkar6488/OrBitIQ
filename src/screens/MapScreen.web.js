import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavbar from '../components/TopNavbar';
import globalStyles from '../styles/globalStyles';
import { colors } from '../styles/colors';

export default function MapScreen({ navigation, embedded = false, contentTopPadding = 0 }) {
  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      {!embedded ? (
        <TopNavbar
          title="ISS Tracker"
          onSearchPress={() => navigation.navigate('Search', { initialType: 'launches' })}
        />
      ) : null}

      <View style={[styles.wrapper, { paddingTop: embedded ? contentTopPadding : 110 }]}>
        <LinearGradient
          colors={['rgba(79,209,255,0.18)', 'rgba(123,97,255,0.18)', 'rgba(5,8,22,0.75)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.title}>ISS Tracker</Text>
          <Text style={styles.subtitle}>
            Live map tracking is not available on web. Open OrbitIQ on iOS or Android to view the ISS map.
          </Text>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 18,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
