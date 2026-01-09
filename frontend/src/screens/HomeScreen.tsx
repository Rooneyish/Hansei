import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const HomeScreen = ({
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateSettings,
}) => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/profile/check-in');
      setStreak(response.data.streak ?? 0);
    } catch (err) {
      setStreak(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <MaterialIcons name="sort" size={30} color="#004346" />
          <Image
            source={require('../assets/logo_dark.png')}
            style={styles.smallLogo}
          />
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>STREAK</Text>
              <Text style={styles.statusValue}>{streak ?? 0} 🔥</Text>
            </View>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>MOOD</Text>
              <Text style={styles.statusValue}>Happy 😊</Text>
            </View>
          </View>

          <View style={styles.journalCard}>
            <Text style={styles.journalTitle}>How are you feeling today?</Text>
            <TextInput
              style={styles.journalInput}
              placeholder="Start your daily reflection..."
              placeholderTextColor="rgba(0, 67, 70, 0.4)"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Daily Practice</Text>
            <View style={styles.grid}>
              {[
                { name: 'Music', icon: 'headset' },
                { name: 'CBT Lab', icon: 'psychology' },
                { name: 'Quests', icon: 'stars' },
                { name: 'Zen Room', icon: 'self-improvement' },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.activityCard}>
                  <MaterialIcons name={item.icon} size={32} color="#004346" />
                  <Text style={styles.activityLabel}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateSettings={onNavigateSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  smallLogo: { width: 50, height: 50, resizeMode: 'contain' },
  statusRow: { flexDirection: 'row', gap: 15 },
  statusBubble: {
    flex: 1,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004346',
    marginTop: 4,
  },
  journalCard: {
    marginTop: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 35,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  journalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004346',
    textAlign: 'center',
    marginBottom: 20,
  },
  journalInput: {
    minHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: '#004346',
    lineHeight: 24,
  },
  activitySection: { marginTop: 30 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004346',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  activityCard: {
    width: '47%',
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activityLabel: {
    marginTop: 8,
    fontWeight: '700',
    color: '#004346',
    fontSize: 14,
  },
});

export default HomeScreen;
