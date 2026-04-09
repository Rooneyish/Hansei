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
import CBTLabScreen from './src/screens/CBTLabScreen';
import ZenRoomScreen from './src/screens/ZenRoomScreen';
import QuestScreen from './src/screens/QuestScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicProvider } from './src/context/MusicContext';
import apiClient from './src/api/client';
import SafetyOverlay from './src/components/SafetyOverlay';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [recommendedTrack, setRecommendedTrack] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);

  const fadeValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [isCBTMode, setIsCBTMode] = useState(false);
  const [activeDistortion, setActiveDistortion] = useState<string | null>(null);
  const [activeThought, setActiveThought] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [isSafetyScreenVisible, setIsSafetyScreenVisible] = useState(false);
  const [crisisHelplines, setCrisisHelplines] = useState([]);

  const handleCrisisDetected = useCallback(helplines => {
    setIsChatVisible(false); 
    setCrisisHelplines(helplines);
    setIsSafetyScreenVisible(true);
  }, []);

  const handlePressAI = useCallback(
    async (
      msg: string | null = null,
      distortion: string | null = null,
      cbtReframe: boolean = false,
    ) => {
      setIsCBTMode(cbtReframe);
      setActiveDistortion(distortion);
      setActiveThought(msg);

      if (msg) {
        try {
          const response = await apiClient.post('/chat/initiate-proactive', {
            distortion: distortion || 'Reflection',
            message: msg,
          });

          setSelectedSessionId(response.data.session_id);
          setProactiveMessage(msg);
        } catch (error: any) {
          if (error.response?.status === 403 && error.response?.data?.isCrisis) {
            handleCrisisDetected(error.response.data.helplines);
            return;
          }
          console.log('Persistence failed, using lazy storage fallback');
          setSelectedSessionId(null);
          setProactiveMessage(msg);
        }
      } else {
        setSelectedSessionId(null);
        setProactiveMessage(null);
      }
      setIsChatVisible(true);
    },
    [],
  );

  const navigateTo = useCallback(
    (screenName: string) => {
      if (screenName === currentScreen) return;

      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.96,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentScreen(screenName);

        Animated.parallel([
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1)),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeValue, scaleValue, currentScreen],
  );

  const handleLoginSuccess = useCallback(
    (role: string) => {
      console.log('App handling login success for role:', role);
      setUserRole(role);
      if (role === 'admin') {
        navigateTo('adminDashboard');
      } else {
        navigateTo('home');
      }
    },
    [navigateTo],
  );

  useEffect(() => {
    if (currentScreen === 'welcome') {
      const checkAuth = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3500));
          const token = await AsyncStorage.getItem('userToken');
          if (token) navigateTo('home');
          else navigateTo('login');
        } catch (err) {
          navigateTo('login');
        }
      };
      checkAuth();
    }
  }, [currentScreen, navigateTo]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      setUserRole(null);
      navigateTo('login');
    } catch (err) {
      console.log('Logout Error:', err);
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
            onNavigateHome={role => handleLoginSuccess(role)}
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
            onNavigateMusic={track => {
              setRecommendedTrack(track);
              navigateTo('music');
            }}
            onNavigateCBT={() => navigateTo('cbtLab')}
            onNavigateZenRoom={() => navigateTo('zenRoom')}
            onNavigateQuests={() => navigateTo('quests')}
            onPressAI={handlePressAI}
            onCrisisDetected={handleCrisisDetected}
          />
        );
      case 'adminDashboard':
        return <AdminDashboardScreen onLogout={handleLogout} />;
      case 'profile':
        return (
          <UserProfileScreen
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onNavigateEditProfile={() => navigateTo('editProfile')}
            onLogout={handleLogout}
            onPressAI={() => handlePressAI(null, null, false)}
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
            onPressAI={() => handlePressAI(null, null, false)}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onSelectChat={id => {
              setProactiveMessage(null);
              setSelectedSessionId(id);
              setIsChatVisible(true);
            }}
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onPressAI={() => handlePressAI(null, null, false)}
          />
        );
      case 'insights':
        return (
          <InsightsScreen
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateHome={() => navigateTo('home')}
            onNavigateInsights={() => navigateTo('insights')}
            onNavigateChatHistory={() => navigateTo('history')}
            onPressAI={() => handlePressAI(null, null, false)}
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
      case 'zenRoom':
        return <ZenRoomScreen onBack={() => navigateTo('home')} />;
      case 'quests':
        return <QuestScreen onBack={() => navigateTo('home')} />;
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
            setIsCBTMode(false);
            setActiveDistortion(null);
            setActiveThought(null);
          }}
          sessionId={selectedSessionId}
          initialMessage={proactiveMessage}
          isReframing={isCBTMode}
          distortion={activeDistortion}
          originalThought={activeThought}
          onCrisisDetected={handleCrisisDetected}
        />

        <SafetyOverlay 
          visible={isSafetyScreenVisible} 
          helplines={crisisHelplines} 
          onResolve={() => setIsSafetyScreenVisible(false)} 
        />
      </View>
    </MusicProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D5F3F3' },
});

export default App;
