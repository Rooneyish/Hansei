import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import ChatOverlay from '../components/ChatOverlay';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const EditProfileScreen = ({
  onBack,
  onUpdateSuccess,
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateChatHistory,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/profile');
        const userData = response.data.user;
        setFormData(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.bio || '',
        }));
      } catch (err) {
        Alert.alert('Error', 'Could not load profile details');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
      };

      await apiClient.patch('/profile', profileData);

      if (showPasswordFields && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          Alert.alert('Error', 'New passwords do not match');
          setSaving(false);
          return;
        }

        await apiClient.patch('/profile/change-password', {
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!');
      setShowPasswordFields(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong';
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#004346" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <MaterialIcons name="chevron-left" size={32} color="#004346" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>General Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.pillInput}
                  value={formData.username}
                  placeholderTextColor="rgba(0, 67, 70, 0.4)"
                  onChangeText={text =>
                    setFormData({ ...formData, username: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.pillInput}
                  value={formData.email}
                  keyboardType="email-address"
                  placeholderTextColor="rgba(0, 67, 70, 0.4)"
                  onChangeText={text =>
                    setFormData({ ...formData, email: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Short Bio</Text>
                <TextInput
                  style={[styles.pillInput, styles.textArea]}
                  value={formData.bio}
                  placeholder="Tell us about your wellness journey..."
                  placeholderTextColor="rgba(0, 67, 70, 0.4)"
                  multiline
                  onChangeText={text => setFormData({ ...formData, bio: text })}
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPasswordFields(!showPasswordFields)}
              >
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <MaterialIcons
                  name={showPasswordFields ? 'expand-less' : 'expand-more'}
                  size={28}
                  color="#004346"
                />
              </TouchableOpacity>

              {showPasswordFields && (
                <View style={styles.passwordFields}>
                  <TextInput
                    style={styles.pillInput}
                    secureTextEntry
                    placeholder="Current Password"
                    placeholderTextColor="rgba(0, 67, 70, 0.4)"
                    value={formData.currentPassword}
                    onChangeText={text =>
                      setFormData({ ...formData, currentPassword: text })
                    }
                  />
                  <TextInput
                    style={styles.pillInput}
                    secureTextEntry
                    placeholder="New Password"
                    placeholderTextColor="rgba(0, 67, 70, 0.4)"
                    value={formData.newPassword}
                    onChangeText={text =>
                      setFormData({ ...formData, newPassword: text })
                    }
                  />
                  <TextInput
                    style={styles.pillInput}
                    secureTextEntry
                    placeholder="Confirm New Password"
                    placeholderTextColor="rgba(0, 67, 70, 0.4)"
                    value={formData.confirmPassword}
                    onChangeText={text =>
                      setFormData({ ...formData, confirmPassword: text })
                    }
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D5F3F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#004346' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 40,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004346',
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    marginBottom: 8,
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#004346',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top', borderRadius: 20 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 67, 70, 0.08)',
    marginVertical: 25,
  },
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordFields: { marginTop: 15, gap: 12 },
  saveBtn: {
    backgroundColor: '#004346',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});

export default EditProfileScreen;
