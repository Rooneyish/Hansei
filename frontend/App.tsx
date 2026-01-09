import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<
    | 'welcome'
    | 'login'
    | 'register'
    | 'home'
    | 'profile'
    | 'insights'
    | 'editProfile'
  >('welcome');

  const fadeValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const navigateTo = useCallback(
    (
      screenName:
        | 'welcome'
        | 'login'
        | 'register'
        | 'home'
        | 'profile'
        | 'insights'
        | 'editProfile',
    ) => {
      if (screenName === currentScreen) return;

      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.96, 
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentScreen(screenName);

        Animated.parallel([
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1, 
            duration: 450,
            easing: Easing.out(Easing.back(1)), 
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeValue, scaleValue, currentScreen],
  );

  useEffect(() => {
    if (currentScreen === 'welcome') {
      const checkAuthAndNavigate = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3500));
          const token = await AsyncStorage.getItem('userToken');

          if (token) {
            navigateTo('home');
          } else {
            navigateTo('login');
          }
        } catch (err) {
          navigateTo('login');
          console.log('Error: ', err);
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
            onNavigateEditProfile={() => navigateTo('editProfile')}
            onLogout={handleLogout}
          />
        );
      case 'editProfile':
        return (
          <EditProfileScreen
            onBack={() => navigateTo('profile')}
            onUpdateSuccess={() => navigateTo('profile')}
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateSettings={() => navigateTo('home')}
          />
        );
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        }}
      >
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
