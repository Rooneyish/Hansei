import React from 'react';
import { View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getKintsugiStage, KINTSUGI_MESSAGES } from '../utils/gamification';

const KintsugiArtifact = ({ gold }) => {
  const stage = getKintsugiStage(gold);
  const message = KINTSUGI_MESSAGES[stage];

  const getIcon = () => {
    switch (stage) {
      case 1:
        return 'blur-on'; // Shattered
      case 2:
        return 'architecture'; // Joined
      case 3:
        return 'auto-fix-high'; // Golden
      case 4:
        return 'workspace-premium'; // Masterpiece
      default:
        return 'blur-on';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.artifactCircle}>
        <MaterialIcons name={getIcon()} size={80} color="#004346" />
        {stage >= 3 && <View style={styles.goldGlow} />}
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  goldGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
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
  },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#004346' },
  goldText: { fontSize: 12, fontWeight: '700', color: '#004346', opacity: 0.5 },
});

export default KintsugiArtifact;
