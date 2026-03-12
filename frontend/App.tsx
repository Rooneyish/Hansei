import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet, Easing, Alert } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ChatOverlay from './src/components/ChatOverlay';
import MusicScreen from './src/screens/MusicScreen';
import CBTLabScreen from './src/screens/CBTLabScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicProvider } from './src/context/MusicContext';
import base64 from 'react-native-base64';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [recommendedTrack, setRecommendedTrack] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [proactiveMessage, setProactiveMessage] = useState(null);

  const expirationTimer = useRef(null);
  const fadeValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const navigateTo = useCallback(
    screenName => {
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
          if (token) navigateTo('home');
          else navigateTo('login');
        } catch (err) {
          navigateTo('login');
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

  const handleNavigateMusic = useCallback(
    (track = null) => {
      setRecommendedTrack(track);
      navigateTo('music');
    },
    [navigateTo],
  );

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
            onNavigateChatHistory={() => navigateTo('history')}
            onNavigateMusic={handleNavigateMusic}
            onNavigateCBT={() => navigateTo('cbtLab')} 
            onPressAI={(msg = null) => {
              setProactiveMessage(msg);
              setSelectedSessionId(null);
              setIsChatVisible(true);
            }}
          />
        );
      case 'profile':
        return (
          <UserProfileScreen
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onNavigateEditProfile={() => navigateTo('editProfile')}
            onLogout={handleLogout}
            onPressAI={() => {
              setProactiveMessage(null); 
              setSelectedSessionId(null);
              setIsChatVisible(true);
            }}
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
            onNavigateChatHistory={() => navigateTo('history')}
            onPressAI={() => {
              setProactiveMessage(null);
              setSelectedSessionId(null);
              setIsChatVisible(true);
            }}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onSelectChat={id => {
              setSelectedSessionId(id);
              setProactiveMessage(null);
              setIsChatVisible(true);
            }}
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onPressAI={() => {
              setProactiveMessage(null);
              setSelectedSessionId(null);
              setIsChatVisible(true);
            }}
          />
        );
      case 'music':
        return (
          <MusicScreen
            onBack={() => {
              setRecommendedTrack(null);
              navigateTo('home');
            }}
            initialTrack={recommendedTrack}
          />
        );
      case 'cbtLab':
        return <CBTLabScreen onBack={() => navigateTo('home')} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <MusicProvider>
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

        <ChatOverlay
          visible={isChatVisible}
          onClose={() => {
            setIsChatVisible(false);
            setSelectedSessionId(null);
            setProactiveMessage(null); 
          }}
          sessionId={selectedSessionId}
          initialMessage={proactiveMessage}
        />
      </View>
    </MusicProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5F3F3',
  },
});

export default App;
