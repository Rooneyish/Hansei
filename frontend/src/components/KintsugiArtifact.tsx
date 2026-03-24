import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getKintsugiStage, KINTSUGI_MESSAGES } from '../utils/gamification';

const VASE_IMAGES = {
  1: require('../assets/shattered_vase.png'),
  2: require('../assets/repaired_vase.png'),
  3: require('../assets/golden_vase.png'),
  4: require('../assets/masterpiece_vase.png'),
};

const KintsugiArtifact = ({ gold }) => {
  const stage = getKintsugiStage(gold);
  const message = KINTSUGI_MESSAGES[stage];

  return (
    <View style={styles.container}>
      <View style={styles.artifactCircle}>
        {stage >= 3 && <View style={styles.goldGlow} />}

        <Image
          source={VASE_IMAGES[stage] || VASE_IMAGES[1]}
          style={styles.vaseImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.stageTitle}>
          Stage {stage}: {stage === 4 ? 'Sealed' : 'Repairing'}
        </Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(gold % 2500) / 25}%` }]}
          />
        </View>
        <Text style={styles.goldText}>{gold} Lacquer Collected</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  artifactCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    position: 'relative',
  },
  vaseImage: {
    width: 140,
    height: 140,
  },
  goldGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(233, 196, 106, 0.4)', 
    zIndex: -1,
  },
  textContainer: { alignItems: 'center', marginBottom: 20 },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004346',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#004346',
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#004346' },
  goldText: { fontSize: 12, fontWeight: '700', color: '#004346', opacity: 0.5 },
});

export default KintsugiArtifact;
