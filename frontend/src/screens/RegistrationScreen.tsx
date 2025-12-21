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

const RegistrationScreen = ({ onNavigate }: { onNavigate: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', `Welcome, ${username}! Registration complete.`);
  };

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.headerRow}>
        <Text style={styles.header}>Welcome to Hansei!</Text>
        <Image
          source={require('../assets/logo_dark.png')}
          style={styles.smallLogo}
        />
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#555"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.registerButtonMain]}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={onNavigate}
        >
          <Text style={[styles.buttonText, styles.loginButtonText]}>Login</Text>
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
    marginBottom: 25,
    fontSize: 16,
    color: '#172a3a',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#004346',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    elevation: 3,
  },
  registerButtonMain: {
    flex: 2, 
    marginRight: 10,
    backgroundColor: '#172a3a',
  },
  loginButton: {
    backgroundColor: '#D5F3F3',
    borderWidth: 2,
    borderColor: '#172a3a',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButtonText: {
    color: '#172a3a',
  },
  form: {
  },
});

export default RegistrationScreen;