import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import KintsugiArtifact from '../components/KintsugiArtifact';
import apiClient from '../api/client';

const QuestScreen = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    total_gold: 0,
    daily_journal: false,
    daily_cbt: false,
    daily_zen: false,
  });

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/profile');
      const user = response.data.user;
      setData({
        total_gold: user.total_gold || 0,
        daily_journal: user.daily_journal || false,
        daily_cbt: user.daily_cbt || false,
        daily_zen: user.daily_zen || false,
      });
    } catch (err) {
      console.log('Error fetching quests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const PillarQuest = ({ title, done, points, icon }) => (
    <View style={[styles.questCard, done && styles.questCardDone]}>
      <View style={styles.questInfo}>
        <View style={[styles.iconCircle, done && styles.iconCircleDone]}>
          <MaterialIcons
            name={done ? 'check' : icon}
            size={24}
            color={done ? '#fff' : '#004346'}
          />
        </View>
        <View>
          <Text style={styles.questTitle}>{title}</Text>
          <Text style={styles.questPoints}>+{points} Gold Lacquer</Text>
        </View>
      </View>
      {done && (
        <View style={styles.statusBadge}>
          <Text style={styles.completedTag}>SEALED</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={32} color="#004346" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hansei Quests</Text>
          <TouchableOpacity onPress={fetchProgress} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#004346" />
            ) : (
              <MaterialIcons name="refresh" size={24} color="#004346" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <KintsugiArtifact gold={data.total_gold} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DAILY RITUALS</Text>

            <PillarQuest
              title="Self-Reflection"
              points={50}
              icon="edit-note"
              done={data.daily_journal}
            />
            <PillarQuest
              title="Cognitive Repair"
              points={50}
              icon="psychology"
              done={data.daily_cbt}
            />
            <PillarQuest
              title="Zen Stillness"
              points={50}
              icon="self-improvement"
              done={data.daily_zen}
            />

            {data.daily_journal && data.daily_cbt && data.daily_zen ? (
              <View style={styles.bonusCard}>
                <MaterialIcons name="auto-awesome" size={24} color="#fff" />
                <Text style={styles.bonusText}>Mastery Bonus Collected!</Text>
              </View>
            ) : (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>
                  Complete all three rituals today to earn an extra +100 bonus.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#004346' },

  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 2,
    marginBottom: 15,
    marginLeft: 5,
  },

  questCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  questCardDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#004346',
  },
  questInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleDone: { backgroundColor: '#004346' },
  questTitle: { fontSize: 16, fontWeight: '800', color: '#004346' },
  questPoints: { fontSize: 12, color: '#004346', opacity: 0.6, marginTop: 2 },

  statusBadge: {
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedTag: { fontSize: 9, fontWeight: '900', color: '#004346' },

  bonusCard: {
    backgroundColor: '#004346',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 15,
  },
  bonusText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  hintBox: {
    marginTop: 15,
    padding: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 67, 70, 0.05)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0, 67, 70, 0.2)',
  },
  hintText: {
    textAlign: 'center',
    color: '#004346',
    opacity: 0.5,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default QuestScreen;


