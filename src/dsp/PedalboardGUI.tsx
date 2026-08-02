import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Cyber-Brain SVE Emblem Component
const BrainLogo = () => (
  <View style={styles.logoContainer}>
    <Text style={styles.brainIcon}>🧠⚡</Text>
  </View>
);

export const PedalboardHeader = ({ isEngineActive }: { isEngineActive: boolean }) => {
  return (
    <View style={styles.headerPanel}>
      <BrainLogo />
      <View style={styles.titleTextContainer}>
        <Text style={styles.brandTitle}>CORAL <Text style={styles.highlightText}>SVE-DSP</Text></Text>
        <Text style={styles.subTitle}>
          {isEngineActive ? '🧠 NEURAL ENGINE ACTIVE • 96kHz / <3ms' : '🧠 BRAIN ENGINE STANDBY'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11111a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D9FF33',
    marginBottom: 16,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00D9FF1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  brainIcon: { fontSize: 22 },
  titleTextContainer: { flex: 1 },
  brandTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  highlightText: { color: '#00D9FF' },
  subTitle: { color: '#8a8a93', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});
