import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const HomeScreen = () => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/profile/check-in');

      if (response.data && response.data.streak !== undefined) {
        setStreak(response.data.streak);
        console.log('Server Message:', response.data.message);
      }
    } catch (err) {
      console.log('Error:', err);
      const fallback = await apiClient.get('/profile/streak');
      setStreak(fallback.data.streak || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return (
    <View style={styles.container}>
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header */}
        <View style={styles.headerRow}>
          <Pressable hitSlop={20}>
            <MaterialIcons name="menu" size={30} color="#004346" />
          </Pressable>
          <Image
            source={require('../assets/logo_dark.png')}
            style={styles.smallLogo}
          />
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statusBar}>
            {/* Daily Streaks Bar*/}
            <LinearGradient
              colors={[
                'rgba(213,243,243,0.5)',
                'rgba(213,242,223,0.5)',
                'rgba(213,233,242,0.5)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusBarInner}
            >
              <View>
                <Text style={styles.statusText}>Daily Streaks</Text>
                {loading ? (
                  <ActivityIndicator size="small" color="#004346" />
                ) : (
                  <Text style={styles.statusValue}>{streak ?? 0}</Text>
                )}
              </View>
              <Text style={styles.emoji}>🔥</Text>
            </LinearGradient>

            {/* Mood Bar */}
            <LinearGradient
              colors={[
                'rgba(213,243,243,0.5)',
                'rgba(213,242,223,0.5)',
                'rgba(213,233,242,0.5)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusBarInner}
            >
              <View>
                <Text style={styles.statusText}>Mood</Text>
                <Text style={[styles.statusValue, { fontSize: 20 }]}>
                  Happy
                </Text>
              </View>
              <Text style={styles.emoji}>😊</Text>
            </LinearGradient>
          </View>

          {/* Journal Entry Box */}
          <View style={styles.journalBox}>
            <Text style={styles.journalPrompt}>
              Greetings! How are you feeling?
            </Text>

            <TextInput
              style={styles.journalInput}
              placeholder="Write your thoughts here..."
              placeholderTextColor="#6b9fa5"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Activity Space */}
          <View style={styles.activitiesContainer}>
            <Text style={styles.activitiesTitle}>Activities</Text>

            <View style={styles.activitiesGrid}>
              {[
                { name: 'Music', emoji: '🎵' },
                { name: 'CBT Exercises', emoji: '🧠' },
                { name: 'Quests', emoji: '🎯' },
                { name: 'Meditation', emoji: '🧘‍♂️' },
              ].map((activity, idx) => (
                <ActivityCard key={idx} activity={activity} />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar />
    </View>
  );
};

const ActivityCard = ({ activity }) => {
  const scale = new Animated.Value(1);
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.gridItem}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.4)']}
          style={styles.activityCard}
        >
          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
          <Text style={styles.activityText}>{activity.name}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  smallLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  statusBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 43, 58, 0.5)',
    paddingHorizontal: 15,
  },
  statusText: {
    color: '#004346',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
    marginBottom: 2,
  },
  statusValue: {
    color: '#004346',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  emoji: {
    fontSize: 28,
  },
  journalBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  journalPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#004346',
    marginBottom: 10,
  },
  journalInput: {
    minHeight: 160,
    fontSize: 15,
    color: '#004346',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f7fbfc',
  },
  activitiesContainer: {
    marginTop: 25,
    width: '100%',
  },
  activitiesTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004346',
    marginBottom: 15,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 15,
  },
  activityCard: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activityEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004346',
  },
});

export default HomeScreen;
