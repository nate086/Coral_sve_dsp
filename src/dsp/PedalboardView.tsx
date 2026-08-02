import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { audioWorkstation } from './AudioWorkstation';

export const PedalboardView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [entropy, setEntropy] = useState(0.2);
  const [drift, setDrift] = useState(0.1);

  const toggleRig = async () => {
    if (!isActive) {
      await audioWorkstation.startGuitarRig();
      setIsActive(true);
    } else {
      audioWorkstation.stop();
      setIsActive(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      audioWorkstation.updateSvePpmSteering(entropy, drift);
    }
  }, [entropy, drift, isActive]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎸 Coral Ultra-Low Latency DSP Rig</Text>
      <Text style={styles.subtitle}>Status: {isActive ? '🟢 LIVE (96kHz / <3ms)' : '🔴 STOPPED'}</Text>

      <TouchableOpacity
        style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
        onPress={toggleRig}
      >
        <Text style={styles.buttonText}>{isActive ? 'Disconnect Guitar Rig' : 'Engage Guitar Rig'}</Text>
      </TouchableOpacity>

      <View style={styles.pedalBox}>
        <Text style={styles.pedalTitle}>SVE / PPM Dynamic Telemetry Modulator</Text>
        
        <TouchableOpacity 
          style={styles.modButton} 
          onPress={() => { setEntropy(0.1); setDrift(0.1); }}
        >
          <Text style={styles.modText}>Clean / Low Entropy (Nominal)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.modButton} 
          onPress={() => { setEntropy(0.6); setDrift(0.5); }}
        >
          <Text style={styles.modText}>Warm Overdrive / Elevated Drift</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.modButton} 
          onPress={() => { setEntropy(0.95); setDrift(0.9); }}
        >
          <Text style={styles.modText}>PPM Shield Engage (Critical Entropy Limit)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0e12', padding: 20, justifyContent: 'center' },
  title: { color: '#00D9FF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#8a8a93', fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 5 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  startButton: { backgroundColor: '#00D9FF' },
  stopButton: { backgroundColor: '#ff4444' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  pedalBox: { backgroundColor: '#1a1a24', padding: 15, borderRadius: 12, borderHeight: 1, borderColor: '#2e2e3e' },
  pedalTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  modButton: { backgroundColor: '#2a2a38', padding: 12, borderRadius: 8, marginVertical: 5 },
  modText: { color: '#00D9FF', fontSize: 14, textAlign: 'center' },
});
