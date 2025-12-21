import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'login' | 'register' | 'home'>('welcome');

  const fadeValue = useRef(new Animated.Value(1)).current;


  const navigateTo = useCallback((screenName: 'welcome' | 'login' | 'register' | 'home') => {
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
  }, [fadeValue]);


  useEffect(() => {
    if (currentScreen === 'welcome') {
      const timer = setTimeout(() => {
      navigateTo('login');
    }, 3000);

    return () => clearTimeout(timer);
    }
  }, [currentScreen,navigateTo]);


  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'login':
        return <LoginScreen 
        onNavigateRegister={() => navigateTo('register')}
        onNavigateHome={() => navigateTo('home')}
         />;
      case 'register':
        return <RegistrationScreen onNavigate={() => navigateTo('login')} />;
      case 'home':
        return <HomeScreen />;
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
    backgroundColor: '#D5F3F3' 
  },
});

export default App;