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
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ onNavigateRegister, onNavigateHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      const token = response.data.user.accessToken;
      await AsyncStorage.setItem('userToken', token);
      onNavigateHome();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong';
      Alert.alert('Login Error', errorMsg);
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
          <Text style={styles.header}>Hansei</Text>
          <Text style={styles.subHeader}>Welcome back to your journey</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.pillInput}
            placeholder="Username"
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.pillInput}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="rgba(0, 67, 70, 0.4)"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Notice', 'Reset instructions sent.')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.btnTextMain}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onNavigateRegister}
          >
            <Text style={styles.btnTextSub}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 50 },
  logo: { width: 100, height: 100, marginBottom: 15, resizeMode: 'contain' },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#004346',
    letterSpacing: -1,
  },
  subHeader: { fontSize: 16, color: '#004346', opacity: 0.6, marginTop: 5 },
  form: { gap: 15 },
  pillInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 18,
    fontSize: 16,
    color: '#004346',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  forgotText: {
    color: '#004346',
    textAlign: 'right',
    opacity: 0.7,
    fontWeight: '600',
  },
  buttonRow: { marginTop: 40, gap: 15 },
  primaryButton: {
    backgroundColor: '#004346',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#004346',
  },
  btnTextMain: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  btnTextSub: { color: '#004346', fontWeight: '600', fontSize: 16 },
});

export default LoginScreen;
