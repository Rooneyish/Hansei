import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NavigationBar from '../components/NavigationBar';
import ChatOverlay from '../components/ChatOverlay';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

const InsightsScreen = ({
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateChatHistory,
  onPressAI,
}) => {
  const [range, setRange] = useState('7 days');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get(`/insights/weekly?range=${range}`);
      setStats(response.data);
    } catch (e) {
      console.log('Error fetching mirror stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const RangeTab = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.tab, range === value && styles.activeTab]}
      onPress={() => {
        setLoading(true);
        setRange(value);
      }}
    >
      <Text style={[styles.tabText, range === value && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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

        <Text style={styles.title}>Hansei Mirror</Text>

        <View style={styles.tabContainer}>
          <RangeTab label="Week" value="7 days" />
          <RangeTab label="Month" value="30 days" />
          <RangeTab label="Year" value="1 year" />
        </View>

        <View style={styles.listContent}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#004346" />
              <Text style={styles.loadingText}>Polishing the mirror...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <MaterialIcons name="edit-note" size={26} color="#004346" />
                  <Text style={styles.statValue}>{stats?.journals || 0}</Text>
                  <Text style={styles.statLabel}>Reflections</Text>
                </View>

                <View style={styles.statCard}>
                  <MaterialIcons
                    name="auto-fix-high"
                    size={26}
                    color="#E9C46A"
                  />
                  <Text style={styles.statValue}>{stats?.reframes || 0}</Text>
                  <Text style={styles.statLabel}>Repairs</Text>
                </View>

                <View style={styles.statCard}>
                  <MaterialIcons
                    name="self-improvement"
                    size={26}
                    color="#2A9D8F"
                  />
                  <Text style={styles.statValue}>
                    {stats?.meditationMins || 0}
                  </Text>
                  <Text style={styles.statLabel}>Zen Mins</Text>
                </View>
              </View>

              <View style={styles.paletteContainer}>
                <View style={styles.paletteHeader}>
                  <Text style={styles.sectionSubtitle}>Emotion Palette</Text>
                  <MaterialIcons
                    name="palette"
                    size={20}
                    color="#004346"
                    style={{ opacity: 0.5 }}
                  />
                </View>

                <Text style={styles.helperText}>
                  Frequency of states during this period
                </Text>

                <View style={styles.emotionsListWrapper}>
                  {stats?.emotions && stats.emotions.length > 0 ? (
                    stats.emotions.map((item, idx) => {
                      const percentage = Math.min(
                        (item.count / (stats.journals || 1)) * 100,
                        100,
                      );

                      return (
                        <View key={idx} style={styles.moodRow}>
                          <Text style={styles.moodName} numberOfLines={1}>
                            {item.primary_emotion}
                          </Text>
                          <View style={styles.barContainer}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${percentage}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.moodCount}>{item.count}</Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <MaterialIcons
                        name="Invert-colors-off"
                        size={40}
                        color="rgba(0,67,70,0.2)"
                      />
                      <Text style={styles.emptyText}>
                        No emotional patterns detected yet.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ChatOverlay
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />

      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateChatHistory={onNavigateChatHistory}
        onPressAI={() => setIsChatVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#004346',
    fontWeight: '600',
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  smallLogo: { width: 50, height: 50, resizeMode: 'contain' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004346',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 25,
    borderRadius: 22,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 18,
  },
  activeTab: { backgroundColor: '#004346' },
  tabText: { fontSize: 14, fontWeight: '700', color: 'rgba(0, 67, 70, 0.5)' },
  activeTabText: { color: '#FFFFFF' },
  listContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#004346',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0, 67, 70, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paletteContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 35,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionSubtitle: { fontSize: 18, fontWeight: '800', color: '#004346' },
  helperText: {
    fontSize: 12,
    color: '#004346',
    opacity: 0.4,
    marginBottom: 10,
    fontWeight: '600',
  },
  emotionsListWrapper: {
    flex: 1,
    justifyContent: 'space-around',
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  moodName: {
    width: 85,
    fontSize: 12,
    fontWeight: '700',
    color: '#004346',
    textTransform: 'capitalize',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 67, 70, 0.05)',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  barFill: { height: '100%', backgroundColor: '#004346', borderRadius: 4 },
  moodCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#004346',
    width: 20,
    textAlign: 'right',
  },
  emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: {
    textAlign: 'center',
    color: '#004346',
    opacity: 0.4,
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default InsightsScreen;
