import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginScreenProps {
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

const LoginScreen = ({
  onNavigateRegister,
  onNavigateHome,
}: LoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });

      const token  = response.data.user.accessToken;

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
      {/* Header section */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Login to Hansei</Text>
        <Image
          source={require('../assets/logo_dark.png')}
          style={styles.smallLogo}
        />
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#555"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
      />

      {/* Forgot Password Link */}
      <TouchableOpacity
        onPress={() => Alert.alert('Reset Password', 'An email has been sent.')}
        style={styles.forgotContainer}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Button Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.loginButtonMain]}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.registerLinkButton]}
          onPress={onNavigateRegister}
        >
          <Text style={[styles.buttonText, styles.registrationButtonText]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#D5F3F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#172a3a',
    marginRight: 10,
  },
  smallLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  input: {
    borderBottomWidth: 2,
    borderColor: '#172a3a',
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#172a3a',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: '#172a3a',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#172a3a',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    elevation: 3,
  },
  loginButtonMain: {
    flex: 2,
    marginRight: 10,
    backgroundColor: '#172a3a',
  },
  registerLinkButton: {
    backgroundColor: '#D5F3F3',
    borderWidth: 2,
    borderColor: '#172a3a',
  },
  registrationButtonText: {
    color: '#172a3a',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
