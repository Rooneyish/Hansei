import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import GradientBackground from '../components/GradientBackground';
import { useMusic } from '../context/MusicContext';
import apiClient from '../api/client';
import { ZenLogModal } from '../components/ZenModal';

const MEDITATION_TYPES = [
  {
    id: 'zanshin',
    title: 'Zanshin',
    sub: 'Focus',
    inhale: 4000,
    exhale: 4000,
    icon: 'adjust',
  },
  {
    id: 'komorebi',
    title: 'Komorebi',
    sub: 'Calm',
    inhale: 4000,
    exhale: 8000,
    icon: 'filter-drama',
  },
  {
    id: 'shinrin',
    title: 'Shinrin',
    sub: 'Nature',
    inhale: 5000,
    exhale: 5000,
    icon: 'park',
  },
  {
    id: 'kintsugi',
    title: 'Kintsugi',
    sub: 'Repair',
    inhale: 6000,
    exhale: 6000,
    icon: 'auto-fix-high',
  },
];

const ZenRoomScreen = ({ onBack }) => {
  const [selectedType, setSelectedType] = useState(MEDITATION_TYPES[0]);
  const [isActive, setIsActive] = useState(false);
  const [intention, setIntention] = useState('');
  const [durationMins, setDurationMins] = useState(5);
  const [seconds, setSeconds] = useState(300);
  const [recordedTime, setRecordedTime] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [loadingIntention, setLoadingIntention] = useState(true);

  const { playTrackByTag, stopTrack, setLoopMode } = useMusic();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const uiOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) setSeconds(durationMins * 60);
  }, [durationMins, isActive]);

  useEffect(() => {
    apiClient
      .get('/zen-room/intention')
      .then(res => setIntention(res.data.intention))
      .catch(() => setIntention('Find stillness in your breath.'))
      .finally(() => setLoadingIntention(false));
  }, []);

  useEffect(() => {
    let breath = null;
    let fadeTimer = null;
    if (isActive) {
      breath = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: selectedType.inhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: selectedType.exhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      breath.start();
      fadeTimer = setTimeout(() => {
        Animated.timing(uiOpacity, {
          toValue: 0.15,
          duration: 2000,
          useNativeDriver: true,
        }).start();
      }, 6000);
    } else {
      pulseAnim.setValue(1);
      uiOpacity.setValue(1);
    }
    return () => {
      breath?.stop();
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [isActive, selectedType]);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0 && isActive) {
      handleEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const fetchIntention = useCallback(async () => {
    setLoadingIntention(true);
    try {
      const response = await apiClient.get('/zen-room/intention');

      if (response.data && response.data.intention) {
        setIntention(response.data.intention);
      } else {
        setIntention('Find stillness in the rhythm of your breath.');
      }
    } catch (err) {
      console.log('Error fetching Zen intention:', err);
      setIntention('Let your thoughts pass like clouds in a vast sky.');
    } finally {
      setLoadingIntention(false);
    }
  }, []);

  const handleToggle = () => {
    if (isActive) handleEnd();
    else {
      setIsActive(true);
      setLoopMode(1);
      playTrackByTag(selectedType.sub);
    }
  };

  const handleEnd = () => {
    const timeSpent = durationMins * 60 - seconds;

    if (timeSpent < 180) {
      setIsActive(false);
      stopTrack();
      Alert.alert(
        'Session Too Short',
        'Practice for at least 3 minute to record your Hansei.',
      );
      setSeconds(durationMins * 60);
    } else {
      setRecordedTime(timeSpent);
      setIsActive(false);
      stopTrack();
      setShowLog(true);
    }
  };

  const formatTime = s =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const wakeUI = () => {
    Animated.timing(uiOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => {
        wakeUI();
        return false;
      }}
    >
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.mainWrapper, { opacity: uiOpacity }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                stopTrack();
                onBack();
              }}
              style={styles.backBtn}
            >
              <MaterialIcons name="chevron-left" size={35} color="#004346" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Zen Room</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>INTENTION</Text>
            {loadingIntention ? (
              <ActivityIndicator size="small" color="#004346" />
            ) : (
              <Text style={styles.featuredTitle}>"{intention}"</Text>
            )}
          </View>

          <View style={styles.visualizerArea}>
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            <View style={styles.visualizerCenter}>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.iconCircleLarge}>
                <MaterialIcons
                  name="self-improvement"
                  size={60}
                  color="#004346"
                />
              </View>
            </View>
            <Text style={styles.breatheStatus}>
              {isActive ? 'Focus on the center' : 'Ready'}
            </Text>
          </View>

          {!isActive && (
            <View style={styles.sliderSection}>
              <Text style={styles.featuredLabel}>
                DURATION: {durationMins} MINS
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={60}
                step={1}
                value={durationMins}
                onValueChange={setDurationMins}
                minimumTrackTintColor="#004346"
                thumbTintColor="#004346"
              />
            </View>
          )}

          <View style={styles.gridSection}>
            <Text style={styles.featuredLabel}>RHYTHM</Text>
            <View style={styles.grid}>
              {MEDITATION_TYPES.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.typeCard,
                    selectedType.id === item.id && styles.activeTypeCard,
                    isActive && { opacity: 0.5 },
                  ]}
                  onPress={() => !isActive && setSelectedType(item)}
                  disabled={isActive}
                >
                  <MaterialIcons name={item.icon} size={20} color="#004346" />
                  <Text style={styles.typeTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.mainActionBtn, isActive && styles.stopActionBtn]}
          onPress={handleToggle}
        >
          <MaterialIcons
            name={isActive ? 'stop' : 'play-arrow'}
            size={32}
            color={isActive ? '#004346' : '#fff'}
          />
          <Text
            style={[
              styles.actionBtnText,
              { color: isActive ? '#004346' : '#fff' },
            ]}
          >
            {isActive ? 'End' : 'Start'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ZenLogModal
        visible={showLog}
        onSave={async mood => {
          if (recordedTime >= 60) {
            try {
              const response = await apiClient.post('/zen-room/save', {
                type: selectedType.title,
                duration: recordedTime,
                moodReflection: mood,
              });

              const { rewards } = response.data;

              setShowLog(false);

              if (rewards && rewards.goldEarned > 0) {
                Alert.alert(
                  'Reflection Sealed ✨',
                  `+${rewards.goldEarned} Gold Lacquer earned!${
                    rewards.masterBonus > 0
                      ? `\nMaster Bonus: +${rewards.masterBonus}!`
                      : ''
                  }`,
                  [{ text: 'Deep Gratitude' }],
                );
              } else {
                Alert.alert(
                  'Session Saved',
                  'Your practice has been recorded.',
                );
              }

              fetchIntention();
            } catch (e) {
              console.error('Save error:', e);
              Alert.alert(
                'Error',
                'Could not reach the temple. Try saving again.',
              );
            }
          } else {
            Alert.alert(
              'Session Too Short',
              'Practice for at least 1 minute to earn rewards.',
            );
            setShowLog(false);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  mainWrapper: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    marginTop: 10,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#004346' },
  featuredCard: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    marginVertical: 20,
  },
  featuredLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 5,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004346',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  visualizerArea: { flex: 1.5, justifyContent: 'center', alignItems: 'center' },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#004346',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  visualizerCenter: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
  },
  iconCircleLarge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  breatheStatus: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '700',
    color: '#004346',
    opacity: 0.6,
  },
  sliderSection: { height: 70, justifyContent: 'center' },
  slider: { width: '100%', height: 40 },
  gridSection: { marginBottom: 15 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  typeCard: {
    width: '48%',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeTypeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#004346',
  },
  typeTitle: { fontWeight: '700', color: '#004346', fontSize: 13 },
  mainActionBtn: {
    height: 55,
    backgroundColor: '#004346',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stopActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: '#004346',
  },
  actionBtnText: { fontWeight: '800', fontSize: 16 },
});

export default ZenRoomScreen;
