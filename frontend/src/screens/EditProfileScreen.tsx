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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const EditProfileScreen = ({
  onBack,
  onUpdateSuccess,
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateSettings,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

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

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
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
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <MaterialIcons name="arrow-back" size={28} color="#004346" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Details */}
          <Text style={styles.sectionTitle}>General Info</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={text => setFormData({ ...formData, username: text })}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            keyboardType="email-address"
            onChangeText={text => setFormData({ ...formData, email: text })}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            multiline
            numberOfLines={4}
            onChangeText={text => setFormData({ ...formData, bio: text })}
          />

          <View style={styles.divider} />

          {/* Password Section Toggle */}
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPasswordFields(!showPasswordFields)}
          >
            <Text style={styles.sectionTitle}>Change Password</Text>
            <MaterialIcons
              name={
                showPasswordFields ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
              }
              size={24}
              color="#004346"
            />
          </TouchableOpacity>

          {showPasswordFields && (
            <View style={styles.passwordSection}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Required to change password"
                value={formData.currentPassword}
                onChangeText={text =>
                  setFormData({ ...formData, currentPassword: text })
                }
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={formData.newPassword}
                onChangeText={text =>
                  setFormData({ ...formData, newPassword: text })
                }
              />

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={text =>
                  setFormData({ ...formData, confirmPassword: text })
                }
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save All Changes</Text>
            )}
          </TouchableOpacity>

          {/* Extra padding for bottom scroll */}
          <View style={{ height: 40 }} />
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#004346' },
  form: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004346',
    marginTop: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004346',
    marginBottom: 6,
    marginTop: 5,
    opacity: 0.7,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#004346',
    borderWidth: 1,
    borderColor: 'rgba(0,67,70,0.1)',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,67,70,0.1)',
    marginVertical: 25,
  },
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordSection: {
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 15,
  },
  saveButton: {
    backgroundColor: '#004346',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    elevation: 4,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default EditProfileScreen;
