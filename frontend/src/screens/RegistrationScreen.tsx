import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

const RegistrationScreen = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !password || confirmPassword !== password) {
      Alert.alert('Error', 'Check all fields.');
      return;
    }
    try {
      await apiClient.post('/auth/register', { username, email, password });
      Alert.alert('Success', 'Welcome to Hansei. Please Login.');
      onNavigate();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <GradientBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerSection}>
          <Image
            source={require('../assets/logo_dark.png')}
            style={styles.logo}
          />
          <Text style={styles.header}>Join Hansei</Text>
          <Text style={styles.subHeader}>
            Begin your self-reflection journey
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.pillInput}
            placeholder="Username"
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.pillInput}
            placeholder="Email"
            keyboardType="email-address"
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.pillInput}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.pillInput}
            placeholder="Confirm Password"
            secureTextEntry
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
          >
            <Text style={styles.btnTextMain}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onNavigate}>
            <Text style={styles.btnTextSub}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 90, height: 90, marginBottom: 10, resizeMode: 'contain' },
  header: { fontSize: 32, fontWeight: '800', color: '#004346' },
  subHeader: { fontSize: 16, color: '#004346', opacity: 0.6, marginTop: 5 },
  form: { gap: 12 },
  pillInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 16,
    fontSize: 15,
    color: '#004346',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonRow: { marginTop: 30, gap: 15 },
  primaryButton: {
    backgroundColor: '#004346',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButton: { paddingVertical: 18, alignItems: 'center' },
  btnTextMain: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  btnTextSub: {
    color: '#004346',
    fontWeight: '600',
    fontSize: 14,
    opacity: 0.8,
  },
});

export default RegistrationScreen;
