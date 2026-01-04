import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
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
    const fetchProfileData = async () => {
      try {
        const response = await apiClient.get('/profile');
        setUser(response.data.user);
      } catch (err) {
        console.error('Error fetching profile: ', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004346" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER SECTION */}
        <View style={styles.headerRow}>
          <View style={{ width: 30 }} />
          <Image
            source={require('../assets/logo_dark.png')}
            style={styles.smallLogo}
          />
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.pageTitle}>Profile</Text>

          {/* USER INFO CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="account-circle" size={100} color="#004346" />
            </View>

            <Text style={styles.username}>{user?.username || 'Guest'}</Text>
            <Text style={styles.email}>{user?.email || 'No email provided'}</Text>

            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                🔥 Longest Streak: <Text style={styles.bold}>{user?.longest_streak || 0}</Text>
              </Text>
            </View>
          </View>

          {/* INTERACTIVE OPTIONS */}
          <View style={styles.optionsContainer}>
            <ProfileOption icon="edit" title="Edit Profile" onPress={onNavigateEditProfile} />
            <ProfileOption icon="notifications" title="Notifications" />
            <ProfileOption icon="security" title="Security" />
            <ProfileOption
              icon="logout"
              title="Log Out"
              color="#d9534f"
              onPress={onLogout}
            />
          </View>
        </View>
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


const ProfileOption = ({ icon, title, color = '#004346', onPress }) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <View style={styles.optionLeft}>
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#D5F3F3' 
  },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  smallLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#004346',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  avatarContainer: { marginBottom: 10 },
  username: { fontSize: 22, fontWeight: '800', color: '#004346' },
  email: { fontSize: 14, color: '#555', marginBottom: 15 },
  streakBadge: {
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
  },
  streakText: {
    color: '#004346',
    fontSize: 16,
  },
  bold: { fontWeight: 'bold' },
  optionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 16, fontWeight: '600', marginLeft: 15 },
});

export default UserProfileScreen;