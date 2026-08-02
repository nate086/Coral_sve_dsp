import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { audioWorkstation, PresetType } from './AudioWorkstation';

export const PedalboardGUI: React.FC = () => {
  const [isEngineActive, setIsEngineActive] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetType>('blues-crunch');

  // Individual Pedal Toggle States
  const [tubeActive, setTubeActive] = useState(true);
  const [bluesActive, setBluesActive] = useState(true);
  const [metalActive, setMetalActive] = useState(false);

  // Knob Values (Drive / Mix)
  const [tubeDrive, setTubeDrive] = useState(2.0);
  const [bluesDrive, setBluesDrive] = useState(2.5);
  const [metalDrive, setMetalDrive] = useState(6.0);

  const toggleEngine = async () => {
    if (!isEngineActive) {
      await audioWorkstation.startGuitarRig();
      setIsEngineActive(true);
    } else {
      audioWorkstation.stop();
      setIsEngineActive(false);
    }
  };

  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    audioWorkstation.applyPreset(preset);

    // Sync UI switches to preset defaults
    switch (preset) {
      case 'clean':
        setTubeActive(true); setBluesActive(false); setMetalActive(false);
        break;
      case 'warm-tube':
        setTubeActive(true); setBluesActive(false); setMetalActive(false);
        break;
      case 'blues-crunch':
        setTubeActive(true); setBluesActive(true); setMetalActive(false);
        break;
      case 'heavy-metal':
        setTubeActive(true); setBluesActive(false); setMetalActive(true);
        break;
    }
  };

  // Sync state changes directly to the SharedArrayBuffer in RAM
  useEffect(() => {
    if (isEngineActive) {
      audioWorkstation.setPedalParams({
        tubeMix: tubeActive ? 0.6 : 0.0,
        tubeDrive,
        bluesMix: bluesActive ? 0.8 : 0.0,
        bluesDrive,
        metalMix: metalActive ? 0.95 : 0.0,
        metalDrive,
      });
    }
  }, [tubeActive, tubeDrive, bluesActive, bluesDrive, metalActive, metalDrive, isEngineActive]);

  return (
    <ScrollView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.title}>🎛️ Coral DSP Workstation</Text>
        <Text style={styles.subtitle}>
          {isEngineActive ? '🟢 RIG ONLINE (96kHz / <3ms)' : '🔴 RIG OFF'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.powerButton, isEngineActive ? styles.powerOn : styles.powerOff]}
          onPress={toggleEngine}
        >
          <Text style={styles.powerButtonText}>
            {isEngineActive ? 'POWER OFF' : 'ENGAGE AUDIO ENGINE'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preset Selector */}
      <Text style={styles.sectionTitle}>QUICK PRESETS</Text>
      <View style={styles.presetRow}>
        {(['clean', 'warm-tube', 'blues-crunch', 'heavy-metal'] as PresetType[]).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.presetCard, activePreset === preset && styles.presetCardActive]}
            onPress={() => handleSelectPreset(preset)}
          >
            <Text style={[styles.presetText, activePreset === preset && styles.presetTextActive]}>
              {preset.toUpperCase().replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pedal Chain Matrix */}
      <Text style={styles.sectionTitle}>MIXABLE PEDALBOARD CHAIN</Text>
      <View style={styles.pedalBoard}>

        {/* PEDAL 1: Vacuum Tube Preamp */}
        <View style={[styles.pedal, tubeActive && styles.pedalActiveBorder]}>
          <View style={styles.pedalHeader}>
            <Text style={styles.pedalName}>💡 TUBE PREAMP</Text>
            <TouchableOpacity 
              style={[styles.stompSwitch, tubeActive ? styles.stompOn : styles.stompOff]}
              onPress={() => setTubeActive(!tubeActive)}
            >
              <Text style={styles.stompText}>{tubeActive ? 'ON' : 'BYPASS'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.knobLabel}>Warmth Drive: {tubeDrive.toFixed(1)}x</Text>
          <View style={styles.knobRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setTubeDrive(Math.max(1.0, tubeDrive - 0.5))}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setTubeDrive(Math.min(5.0, tubeDrive + 0.5))}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PEDAL 2: Blues Crunch */}
        <View style={[styles.pedal, bluesActive && styles.pedalActiveBorder]}>
          <View style={styles.pedalHeader}>
            <Text style={styles.pedalName}>🎷 BLUES OVERDRIVE</Text>
            <TouchableOpacity 
              style={[styles.stompSwitch, bluesActive ? styles.stompOn : styles.stompOff]}
              onPress={() => setBluesActive(!bluesActive)}
            >
              <Text style={styles.stompText}>{bluesActive ? 'ON' : 'BYPASS'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.knobLabel}>Crunch Drive: {bluesDrive.toFixed(1)}x</Text>
          <View style={styles.knobRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setBluesDrive(Math.max(1.0, bluesDrive - 0.5))}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setBluesDrive(Math.min(6.0, bluesDrive + 0.5))}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PEDAL 3: Heavy Metal High Gain */}
        <View style={[styles.pedal, metalActive && styles.pedalActiveBorder]}>
          <View style={styles.pedalHeader}>
            <Text style={styles.pedalName}>⚡ METAL DISTORTION</Text>
            <TouchableOpacity 
              style={[styles.stompSwitch, metalActive ? styles.stompOn : styles.stompOff]}
              onPress={() => setMetalActive(!metalActive)}
            >
              <Text style={styles.stompText}>{metalActive ? 'ON' : 'BYPASS'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.knobLabel}>Gain Thrust: {metalDrive.toFixed(1)}x</Text>
          <View style={styles.knobRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setMetalDrive(Math.max(2.0, metalDrive - 1.0))}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => setMetalDrive(Math.min(10.0, metalDrive + 1.0))}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  header: { alignItems: 'center', marginVertical: 15 },
  title: { color: '#00D9FF', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#8a8a93', fontSize: 13, marginTop: 4 },
  powerButton: { marginTop: 15, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  powerOn: { backgroundColor: '#ff4444' },
  powerOff: { backgroundColor: '#00D9FF' },
  powerButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { color: '#6e6e7e', fontSize: 12, fontWeight: 'bold', marginTop: 15, marginBottom: 8, letterSpacing: 1 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  presetCard: { flex: 1, backgroundColor: '#161620', paddingVertical: 10, paddingHorizontal: 4, marginHorizontal: 2, borderRadius: 6, alignItems: 'center' },
  presetCardActive: { backgroundColor: '#203040', borderWidth: 1, borderColor: '#00D9FF' },
  presetText: { color: '#8a8a93', fontSize: 10, fontWeight: 'bold' },
  presetTextActive: { color: '#00D9FF' },
  pedalBoard: { gap: 12, marginBottom: 30 },
  pedal: { backgroundColor: '#14141e', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#222232' },
  pedalActiveBorder: { borderColor: '#00D9FF' },
  pedalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedalName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  stompSwitch: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  stompOn: { backgroundColor: '#00D9FF' },
  stompOff: { backgroundColor: '#2a2a3a' },
  stompText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  knobLabel: { color: '#aaa', fontSize: 12, marginTop: 10 },
  knobRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  adjustBtn: { backgroundColor: '#222232', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  adjustText: { color: '#00D9FF', fontSize: 18, fontWeight: 'bold' },
});
