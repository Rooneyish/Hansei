import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';
import { useMusic } from '../context/MusicContext';

const PillarIcon = ({ label, done, icon }) => (
  <View style={styles.pillarItem}>
    <View style={[styles.pillarCircle, done && styles.pillarCircleDone]}>
      <MaterialIcons
        name={done ? 'check' : icon}
        size={18}
        color={done ? '#fff' : 'rgba(0, 67, 70, 0.4)'}
      />
    </View>
    <Text style={[styles.pillarLabel, done && styles.pillarLabelDone]}>
      {label}
    </Text>
  </View>
);

const HomeScreen = ({
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateChatHistory,
  onNavigateMusic,
  onNavigateCBT,
  onNavigateZenRoom,
  onNavigateQuests,
  onPressAI,
  onCrisisDetected,
}) => {
  const [streak, setStreak] = useState(null);
  const [mood, setMood] = useState('Reflective ✨');
  const [journalText, setJournalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [progress, setProgress] = useState({
    total_gold: 0,
    daily_journal: false,
    daily_cbt: false,
    daily_zen: false,
  });

  const { isPlaying } = useMusic();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchUserData = useCallback(async () => {
    try {
      const response = await apiClient.get('/profile');
      const data = response.data.user;
      setStreak(data.current_streak || 0);
      setMood(data.current_mood || 'Reflective ✨');

      setProgress({
        total_gold: data.total_gold || 0,
        daily_journal: data.daily_journal || false,
        daily_cbt: data.daily_cbt || false,
        daily_zen: data.daily_zen || false,
      });
    } catch (err) {
      console.log('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    let animation = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isPlaying, pulseAnim]);

  const processImageForOCR = async result => {
    if (result.didCancel || !result.assets) return;
    const base64Image = result.assets[0].base64;

    setIsScanning(true);
    try {
      const response = await apiClient.post('/journal/scan', {
        imageBase64: base64Image,
      });
      if (response.data.text) {
        setJournalText(prev =>
          prev ? `${prev}\n${response.data.text}` : response.data.text,
        );
      }
    } catch (err) {
      Alert.alert('Scan Error', 'Could not extract text.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanPress = () => {
    const options = { mediaType: 'photo', includeBase64: true, quality: 0.5 };
    Alert.alert('Scan Source', 'Choose how to scan your journal:', [
      {
        text: 'Camera',
        onPress: async () => processImageForOCR(await launchCamera(options)),
      },
      {
        text: 'Gallery',
        onPress: async () =>
          processImageForOCR(await launchImageLibrary(options)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmitJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('Empty Entry', 'Please write some thoughts first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/journal/submit', {
        content: journalText,
      });

      const {
        mood: newMood,
        streak: newStreak,
        music_recommendation,
        emotion,
        trigger_chat,
        cbt_analysis,
        rewards,
      } = response.data;

      setJournalText('');
      Keyboard.dismiss();
      if (newMood) setMood(newMood);
      if (newStreak !== undefined) setStreak(newStreak);

      const rewardText =
        rewards?.goldEarned > 0
          ? `\n\n✨ +${rewards.goldEarned} Gold Lacquer earned!`
          : '';
      const rawDistortion = cbt_analysis?.distortion || 'none';
      const cleanDistortion = rawDistortion
        .replace(/[".]/g, '')
        .toLowerCase()
        .trim();
      const rawReframe =
        cbt_analysis?.reframe || cbt_analysis?.reframed_thought || '';
      const cleanReframe = rawReframe.replace(/[".]/g, '').trim();

      if (
        trigger_chat &&
        cleanDistortion !== 'none' &&
        cleanDistortion !== 'reflection'
      ) {
        Alert.alert(
          'Hansei is thinking... ✨',
          `I noticed a pattern of ${cleanDistortion} in your reflection.${rewardText}\n\n"${cleanReframe}"`,
          [
            {
              text: 'Not now',
              style: 'cancel',
              onPress: () => fetchUserData(),
            },
            {
              text: 'Let’s talk',
              onPress: () => {
                fetchUserData();
                onPressAI(cleanReframe, cleanDistortion, true);
              },
            },
          ],
        );
        return;
      }
      if (music_recommendation) {
        Alert.alert(
          'Reflection Analyzed ✨',
          `You seem to be feeling ${emotion}.${rewardText}\n\nBased on your Hansei, we recommend: "${music_recommendation.title}"`,
          [
            { text: 'Later', style: 'cancel', onPress: () => fetchUserData() },
            {
              text: 'Listen Now',
              onPress: () => {
                fetchUserData();
                onNavigateMusic(music_recommendation);
              },
            },
          ],
        );
        return;
      }
      Alert.alert(
        'Entry Saved',
        `Your daily reflection has been recorded.${rewardText}`,
        [{ text: 'Seal Reflection', onPress: () => fetchUserData() }],
      );
    } catch (err) {
      if (
        err.response &&
        err.response.status === 403 &&
        err.response.data?.isCrisis
      ) {
        setJournalText(''); Keyboard.dismiss();
        onCrisisDetected(err.response.data.helplines); 
        return;
      }
      console.log('Submission Error:', err);
      Alert.alert('Error', 'Failed to save reflection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <MaterialIcons name="sort" size={30} color="#004346" />
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
          <View style={styles.moodBar}>
            <Text style={styles.statusLabel}>CURRENT EMOTION</Text>
            <Text style={styles.moodValue}>{mood}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>GOLD</Text>
              <Text style={styles.statusValue}>{progress.total_gold} 🏺</Text>
            </View>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>STREAK</Text>
              {streak === null ? (
                <ActivityIndicator size="small" color="#004346" />
              ) : (
                <Text style={styles.statusValue}>{streak} 🔥</Text>
              )}
            </View>
          </View>

          <View style={styles.ritualCard}>
            <Text style={styles.ritualLabel}>DAILY RITUAL</Text>
            <View style={styles.pillarRow}>
              <PillarIcon
                label="Journal"
                done={progress.daily_journal}
                icon="edit"
              />
              <PillarIcon
                label="CBT"
                done={progress.daily_cbt}
                icon="psychology"
              />
              <PillarIcon
                label="Zen"
                done={progress.daily_zen}
                icon="self-improvement"
              />
            </View>
          </View>

          <View style={styles.journalCard}>
            <Text style={styles.journalTitle}>How are you feeling today?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.journalInput}
                placeholder="Start your daily reflection..."
                placeholderTextColor="rgba(0, 67, 70, 0.4)"
                multiline
                value={journalText}
                onChangeText={setJournalText}
                textAlignVertical="top"
              />
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={handleScanPress}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#004346" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="camera-alt"
                        size={20}
                        color="#004346"
                      />
                      <Text style={styles.actionBtnText}>Scan Text</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    !journalText.trim() && { opacity: 0.5 },
                  ]}
                  onPress={handleSubmitJournal}
                  disabled={isSubmitting || !journalText.trim()}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Entry</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Daily Practice</Text>
            <View style={styles.grid}>
              {[
                { name: 'Music', icon: 'headset' },
                { name: 'CBT Lab', icon: 'psychology' },
                { name: 'Quests', icon: 'stars' },
                { name: 'Zen Room', icon: 'self-improvement' },
              ].map((item, idx) => {
                const isThisMusicPlaying = item.name === 'Music' && isPlaying;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.activityCard,
                      isThisMusicPlaying && styles.activeMusicCard,
                    ]}
                    onPress={() => {
                      if (item.name === 'Music') onNavigateMusic();
                      else if (item.name === 'CBT Lab') onNavigateCBT();
                      else if (item.name === 'Zen Room') onNavigateZenRoom();
                      else if (item.name === 'Quests') onNavigateQuests();
                      else
                        Alert.alert(
                          'Coming Soon',
                          `${item.name} is under development.`,
                        );
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.iconContainer,
                        isThisMusicPlaying && {
                          transform: [{ scale: pulseAnim }],
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={isThisMusicPlaying ? 'graphic-eq' : item.icon}
                        size={32}
                        color="#004346"
                      />
                    </Animated.View>
                    <Text
                      style={[
                        styles.activityLabel,
                        isThisMusicPlaying && styles.activeLabel,
                      ]}
                    >
                      {isThisMusicPlaying ? 'Playing' : item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateChatHistory={onNavigateChatHistory}
        onPressAI={() => onPressAI(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  smallLogo: { width: 50, height: 50, resizeMode: 'contain' },

  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  statusBubble: {
    flex: 1,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004346',
    marginTop: 2,
  },
  statusValueMood: {
    fontSize: 14,
    fontWeight: '800',
    color: '#004346',
    marginTop: 2,
    textAlign: 'center',
  },

  ritualCard: {
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  ritualLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#004346',
    opacity: 0.6,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  pillarRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pillarItem: { alignItems: 'center', gap: 5 },
  pillarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 67, 70, 0.1)',
  },
  pillarCircleDone: { backgroundColor: '#004346', borderColor: '#004346' },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0, 67, 70, 0.4)',
  },
  pillarLabelDone: { color: '#004346' },

  journalCard: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 35,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  journalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004346',
    textAlign: 'center',
    marginBottom: 15,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  journalInput: {
    minHeight: 180,
    padding: 20,
    fontSize: 16,
    color: '#004346',
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 67, 70, 0.03)',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#004346' },
  submitBtn: {
    backgroundColor: '#004346',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 15,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  activitySection: { marginTop: 30 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004346',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  activityCard: {
    width: '47%',
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activityLabel: {
    marginTop: 8,
    fontWeight: '700',
    color: '#004346',
    fontSize: 14,
  },
  activeMusicCard: {
    borderColor: '#004346',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
  },
  activeLabel: { color: '#004346', fontWeight: '900' },
  iconContainer: { justifyContent: 'center', alignItems: 'center' },
  moodBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    alignItems: 'center',
  },
  moodValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004346',
    marginTop: 2,
  },
});

export default HomeScreen;
