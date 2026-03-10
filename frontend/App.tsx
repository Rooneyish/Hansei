import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ChatOverlay from './src/components/ChatOverlay';
import MusicScreen from './src/screens/MusicScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicProvider } from './src/context/MusicContext';
import base64 from 'react-native-base64';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<
    | 'welcome'
    | 'login'
    | 'register'
    | 'home'
    | 'profile'
    | 'insights'
    | 'editProfile'
    | 'history'
    | 'music'
  >('welcome');

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const expirationTimer = useRef(null);
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
        | 'editProfile'
        | 'history'
        | 'music',
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

  const setupLocalExpiryTimer = useCallback(
    token => {
      try {
        if (!token || typeof token !== 'string') return;

        const base64Url = token.split('.')[1];
        if (!base64Url) return;

        let base64Str = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64Str.length % 4 !== 0) {
          base64Str += '=';
        }

        const jsonPayload = base64.decode(base64Str);
        const payload = JSON.parse(jsonPayload);

        const expiryInMs = payload.exp * 1000;
        const timeLeft = expiryInMs - Date.now();

        if (expirationTimer.current) clearTimeout(expirationTimer.current);

        if (timeLeft > 0) {
          console.log(
            `Auto-logout set for ${Math.round(
              timeLeft / 1000 / 60,
            )} minutes from now.`,
          );
          expirationTimer.current = setTimeout(() => {
            Alert.alert('Session Expired', 'Please log in again.');
            handleLogout();
          }, timeLeft);
        } else {
          console.warn('Token already expired, triggering logout.');
          handleLogout();
        }
      } catch (e) {
        console.error('Timer setup failed:', e);
      }
    },
    [handleLogout],
  );

  const handleExpiredToken = useCallback(
    async token => {
      if (!token) return 'expired';

      try {
        const response = await fetch('http://0.0.0.0:3000/api/auth/verify', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.status !== 200 || data.status === 'expired') {
          return 'expired';
        }

        setupLocalExpiryTimer(token);
        return 'valid';
      } catch (err) {
        console.error('Verification error:', err);
        return 'expired';
      }
    },
    [setupLocalExpiryTimer],
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const token = await AsyncStorage.getItem('userToken');
        const authStatus = await handleExpiredToken(token);

        if (authStatus === 'expired') {
          await handleLogout();
        } else {
          navigateTo('home');
        }
      } catch (err) {
        navigateTo('login');
      }
    };

    initAuth();
  }, []);

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
            onNavigateMusic={() => navigateTo('music')}
            onPressAI={() => {
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
              setIsChatVisible(true);
            }}
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onPressAI={() => {
              setSelectedSessionId(null);
              setIsChatVisible(true);
            }}
          />
        );
      case 'music':
        return <MusicScreen onBack={() => navigateTo('home')} />;
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
          }}
          sessionId={selectedSessionId}
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
