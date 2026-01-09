import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const UserProfileScreen = ({
  onNavigateHome,
  onNavigateProfile,
  onNavigateInsights,
  onNavigateSettings,
  onLogout,
  onNavigateEditProfile,
}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/profile')
      .then(res => setUser(res.data.user))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004346" />
      </View>
    );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>Your Reflection Space</Text>

          <View style={styles.glassCard}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={80} color="#fff" />
            </View>
            <Text style={styles.username}>{user?.username || 'Seeker'}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                🔥 Best Streak: {user?.longest_streak || 0}
              </Text>
            </View>
          </View>

          <View style={styles.menuContainer}>
            <ProfileLink
              icon="edit"
              title="Edit Profile"
              onPress={onNavigateEditProfile}
            />
            <ProfileLink icon="history" title="Reflection History" />
            <ProfileLink icon="verified-user" title="Privacy & Security" />
            <ProfileLink
              icon="power-settings-new"
              title="Log Out"
              isDanger
              onPress={onLogout}
            />
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

const ProfileLink = ({ icon, title, isDanger, onPress }) => (
  <TouchableOpacity style={styles.linkRow} onPress={onPress}>
    <View style={styles.linkLeft}>
      <MaterialIcons
        name={icon}
        size={24}
        color={isDanger ? '#d9534f' : '#004346'}
      />
      <Text style={[styles.linkText, isDanger && { color: '#d9534f' }]}>
        {title}
      </Text>
    </View>
    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  scrollContent: { padding: 25, paddingBottom: 150 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#004346',
    textAlign: 'center',
    marginBottom: 30,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#004346',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  username: { fontSize: 26, fontWeight: '800', color: '#004346' },
  email: { fontSize: 16, color: '#004346', opacity: 0.6, marginBottom: 20 },
  streakBadge: {
    backgroundColor: '#004346',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  streakText: { color: '#fff', fontWeight: 'bold' },
  menuContainer: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  linkText: { fontSize: 16, fontWeight: '600', color: '#004346' },
});

export default UserProfileScreen;
