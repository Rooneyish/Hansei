import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminDashboardScreen = ({ onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); 
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const timerRef = useRef(null);

  const fetchAdminStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await apiClient.get('/admin/stats');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.log('Admin Fetch Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
    timerRef.current = setInterval(() => fetchAdminStats(true), 30000);
    return () => clearInterval(timerRef.current);
  }, [fetchAdminStats]);

  const toggleExpand = card => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setExpandedCard(expandedCard === card ? null : card);
  };

  const SubMetric = ({ label, value, color = '#004346' }) => (
    <View style={styles.subMetricRow}>
      <Text style={styles.subMetricLabel}>{label}</Text>
      <Text style={[styles.subMetricValue, { color }]}>{value || 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <MaterialIcons
              name="power-settings-new"
              size={24}
              color="#D9534F"
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Admin Portal</Text>
            <Text style={styles.lastUpdatedText}>
              Live • Updated:{' '}
              {lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => fetchAdminStats()}>
            <MaterialIcons name="refresh" size={24} color="#004346" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAdminStats();
              }}
            />
          }
        >
          {loading && !data ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#004346" />
            </View>
          ) : (
            <>
              {data?.safetyLogs && data.safetyLogs.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: '#D9534F', opacity: 1 },
                    ]}
                  >
                    🚨 ACTIVE SAFETY ALERTS
                  </Text>
                  <View style={styles.crisisContainer}>
                    {data.safetyLogs.map((log, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.crisisRow,
                          idx !== 0 && {
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(217, 83, 79, 0.1)',
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.crisisUser}>{log.username}</Text>
                          <Text style={styles.crisisDetail}>
                            Mood: {log.current_mood}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.infoBtn}
                          onPress={() =>
                            Alert.alert(
                              'Citizen Alert',
                              `Email: ${log.email}\nStatus: Flagged for Safety`,
                            )
                          }
                        >
                          <MaterialIcons
                            name="contact-support"
                            size={22}
                            color="#D9534F"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Platform Pulse</Text>
              <View style={styles.grid}>
                <TouchableOpacity
                  style={[
                    styles.metricCard,
                    expandedCard === 'safety' && styles.expandedCard,
                    data?.metrics?.current_active_crises > 0 &&
                      styles.alertBorder,
                  ]}
                  onPress={() => toggleExpand('safety')}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons
                      name="security"
                      size={24}
                      color={
                        data?.metrics?.current_active_crises > 0
                          ? '#D9534F'
                          : '#004346'
                      }
                    />
                    <Text
                      style={[
                        styles.metricValue,
                        data?.metrics?.current_active_crises > 0 && {
                          color: '#D9534F',
                        },
                      ]}
                    >
                      {data?.metrics?.current_active_crises}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>ACTIVE CRISES</Text>
                  {expandedCard === 'safety' && (
                    <View style={styles.expansion}>
                      <SubMetric
                        label="Detected (All Time)"
                        value={data?.metrics?.total_crises_detected}
                        color="#D9534F"
                      />
                      <SubMetric
                        label="Resolved"
                        value={data?.metrics?.total_crises_resolved}
                        color="#2A9D8F"
                      />
                      <SubMetric
                        label="Success Rate"
                        value={
                          data?.metrics?.total_crises_detected > 0
                            ? Math.round(
                                (data?.metrics?.total_crises_resolved /
                                  data?.metrics?.total_crises_detected) *
                                  100,
                              ) + '%'
                            : '100%'
                        }
                        color="#2A9D8F"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.metricCard,
                    expandedCard === 'users' && styles.expandedCard,
                  ]}
                  onPress={() => toggleExpand('users')}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="people" size={24} color="#004346" />
                    <Text style={styles.metricValue}>
                      {data?.metrics?.total_users}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>TOTAL USERS</Text>
                  {expandedCard === 'users' && (
                    <View style={styles.expansion}>
                      <SubMetric
                        label="Online (15m)"
                        value={data?.metrics?.online_users}
                        color="#2A9D8F"
                      />
                      <SubMetric
                        label="Safe Status"
                        value={data?.metrics?.safe_users}
                      />
                      <SubMetric
                        label="In Crisis"
                        value={data?.metrics?.crisis_users}
                        color="#D9534F"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.metricCard,
                    expandedCard === 'journals' && styles.expandedCard,
                  ]}
                  onPress={() => toggleExpand('journals')}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="edit-note" size={24} color="#004346" />
                    <Text style={styles.metricValue}>
                      {data?.metrics?.journals_today}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>JOURNALS (24H)</Text>
                  {expandedCard === 'journals' && (
                    <View style={styles.expansion}>
                      <SubMetric
                        label="Safe Entries"
                        value={
                          data?.metrics?.journals_today -
                          data?.metrics?.flagged_today
                        }
                        color="#2A9D8F"
                      />
                      <SubMetric
                        label="Flagged/Reframes"
                        value={data?.metrics?.flagged_today}
                        color="#D9534F"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Recent Citizens</Text>
              <View style={styles.userListCard}>
                {data?.recentUsers?.map((item, idx) => (
                  <View
                    key={item.user_id || idx}
                    style={[
                      styles.userRow,
                      idx !== 0 && {
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <View>
                      <Text style={styles.usernameText}>{item.username}</Text>
                      <Text style={styles.emailText}>{item.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'admin' && styles.adminBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          item.role === 'admin' && styles.adminRoleText,
                        ]}
                      >
                        {item.role?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Hansei Core v1.4.1 • Safety Polling Active
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#004346' },
  lastUpdatedText: {
    fontSize: 10,
    color: '#004346',
    opacity: 0.5,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: 'rgba(217, 83, 79, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.2)',
  },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#004346',
    opacity: 0.4,
    letterSpacing: 2,
    marginBottom: 15,
    marginTop: 10,
    textTransform: 'uppercase',
  },

  crisisContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.3)',
    padding: 5,
    marginBottom: 25,
  },
  crisisRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  crisisUser: { fontSize: 16, fontWeight: '800', color: '#D9534F' },
  crisisDetail: {
    fontSize: 12,
    color: '#004346',
    opacity: 0.6,
    marginTop: 2,
    fontWeight: '600',
  },
  infoBtn: { padding: 8 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 25,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
  },
  alertBorder: {
    borderColor: 'rgba(217, 83, 79, 0.5)',
    backgroundColor: 'rgba(217, 83, 79, 0.05)',
  },
  expandedCard: { width: '100%', alignItems: 'flex-start' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricValue: { fontSize: 24, fontWeight: '900', color: '#004346' },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    marginTop: 2,
    letterSpacing: 1,
  },

  expansion: {
    width: '100%',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  subMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subMetricLabel: {
    fontSize: 12,
    color: '#004346',
    opacity: 0.6,
    fontWeight: '700',
  },
  subMetricValue: { fontSize: 14, fontWeight: '800' },

  userListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  usernameText: { fontSize: 15, fontWeight: '700', color: '#004346' },
  emailText: { fontSize: 12, color: '#004346', opacity: 0.5 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,67,70,0.1)',
  },
  adminBadge: { backgroundColor: '#D9534F' },
  roleText: { fontSize: 9, fontWeight: '900', color: '#004346' },
  adminRoleText: { color: '#fff' },
  footer: { marginTop: 40, alignItems: 'center', opacity: 0.3 },
  footerText: { fontSize: 10, fontWeight: '700', color: '#004346' },
});

export default AdminDashboardScreen;
