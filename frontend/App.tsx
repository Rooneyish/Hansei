import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  NativeAppEventEmitter,
} from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<
    'welcome' | 'login' | 'register' | 'home' | 'profile' | 'insights'
  >('welcome');

  const fadeValue = useRef(new Animated.Value(1)).current;

  const navigateTo = useCallback(
    (
      screenName:
        | 'welcome'
        | 'login'
        | 'register'
        | 'home'
        | 'profile'
        | 'insights',
    ) => {
      if (screenName === currentScreen) return;
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen(screenName);
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeValue, currentScreen],
  );

  useEffect(() => {
    if (currentScreen === 'welcome') {
      const checkAuthAndNavigate = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));

          const token = await AsyncStorage.getItem('userToken');

          if (token) {
            navigateTo('home');
          } else {
            navigateTo('login');
          }
        } catch (err) {
          navigateTo('login');
          console.log('Error: ', err)
        }
      };

      checkAuthAndNavigate();
    }
  }, [currentScreen, navigateTo]);
  
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigateTo('login');
    } catch (err) {
      console.log('Error logging out: ', err);
    }
  }, [navigateTo]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'login':
        return (
          <LoginScreen
            onNavigateRegister={() => navigateTo('register')}
            onNavigateHome={() => navigateTo('home')}
          />
        );
      case 'register':
        return <RegistrationScreen onNavigate={() => navigateTo('login')} />;
      case 'home':
        return (
          <HomeScreen
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateSettings={() => navigateTo('home')}
          />
        );
      case 'profile':
        return (
          <UserProfileScreen
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateSettings={() => navigateTo('home')}
            onLogout={handleLogout}
          />
        );
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {}
      <Animated.View style={{ flex: 1, opacity: fadeValue }}>
        {renderScreen()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5F3F3',
  },
});

export default App;
