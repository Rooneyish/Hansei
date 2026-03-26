import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

const AdminDashboardScreen = ({ onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setData(response.data);
    } catch (err) {
      console.log('Admin Fetch Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const MetricCard = ({ label, value, icon, color = '#004346' }) => (
    <View style={styles.metricCard}>
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value || 0}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
          <Text style={styles.headerTitle}>Admin Portal</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              fetchAdminStats();
            }}
          >
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
              tintColor="#004346"
            />
          }
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#004346" />
              <Text style={styles.loadingText}>Fetching system metrics...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Platform Pulse</Text>

              <View style={styles.grid}>
                <MetricCard
                  label="TOTAL USERS"
                  value={data?.stats.total_users}
                  icon="people"
                />
                <MetricCard
                  label="JOURNALS 24H"
                  value={data?.stats.journals_today}
                  icon="edit-note"
                />
                <MetricCard
                  label="ZEN SESSIONS"
                  value={data?.stats.total_zen_sessions}
                  icon="self-improvement"
                  color="#2A9D8F"
                />
                <MetricCard
                  label="GOLD AWARDED"
                  value={data?.stats.total_gold_awarded}
                  icon="stars"
                  color="#E9C46A"
                />
              </View>

              <Text style={styles.sectionTitle}>Recent Citizens</Text>
              <View style={styles.userListCard}>
                {data?.recentUsers && data.recentUsers.length > 0 ? (
                  data.recentUsers.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.userRow,
                        idx === 0 && { borderTopWidth: 0 },
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
                          {item.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    No users found in system.
                  </Text>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Hansei System OS v1.2.0 • Encryption Active
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
  loadingText: {
    marginTop: 10,
    color: '#004346',
    fontWeight: '700',
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: 'rgba(217, 83, 79, 0.1)', 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.2)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#004346' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#004346',
    opacity: 0.4,
    letterSpacing: 2,
    marginBottom: 15,
    marginTop: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30,
  },
  metricCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#004346' },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    marginTop: 2,
  },

  userListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,67,70,0.05)',
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
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#004346',
    opacity: 0.4,
  },

  footer: { marginTop: 40, alignItems: 'center', opacity: 0.3 },
  footerText: { fontSize: 10, fontWeight: '700', color: '#004346' },
});

export default AdminDashboardScreen;
