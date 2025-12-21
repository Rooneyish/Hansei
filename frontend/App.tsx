import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'login' | 'register'>('welcome');

  const fadeValue = useRef(new Animated.Value(1)).current;


  const navigateTo = useCallback((screenName: 'welcome' | 'login' | 'register') => {
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
    const timer = setTimeout(() => {
      navigateTo('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigateTo]);


  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'login':
        return <LoginScreen onNavigate={() => navigateTo('register')} />;
      case 'register':
        return <RegistrationScreen onNavigate={() => navigateTo('login')} />;
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