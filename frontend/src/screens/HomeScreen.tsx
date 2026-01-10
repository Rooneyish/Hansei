import React, { useEffect, useState, useCallback } from 'react';
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
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import GradientBackground from '../components/GradientBackground';
import NavigationBar from '../components/NavigationBar';
import apiClient from '../api/client';

const HomeScreen = ({
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateSettings,
}) => {
  const [streak, setStreak] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Hansei Camera Permission',
            message: 'Hansei needs access to your camera to scan your journal.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; 
  };

  const fetchStreak = useCallback(async () => {
    try {
      const response = await apiClient.post('/profile/check-in');
      setStreak(response.data.streak ?? 0);
    } catch (err) {
      setStreak(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const processImageForOCR = async result => {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Action failed');
      return;
    }

    const base64Image = result.assets?.[0]?.base64;
    if (!base64Image) return;

    setIsScanning(true);
    try {
      const response = await apiClient.post('/journal/scan', {
        imageBase64: base64Image,
      });

      if (response.data.text) {
        setJournalText(prev =>
          prev ? `${prev}\n${response.data.text}` : response.data.text,
        );
        Alert.alert('Success', 'Text extracted successfully!');
      }
    } catch (err) {
      Alert.alert(
        'AI Error',
        'Could not extract text. Ensure the image is clear.',
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanPress = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5,
      maxWidth: 1500,
      maxHeight: 1500,
    };

    Alert.alert('Scan Reflection', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (hasPermission) {
            const result = await launchCamera(options);
            processImageForOCR(result);
          } else {
            Alert.alert(
              'Permission Denied',
              'Camera access is required to scan text.',
            );
          }
        },
      },
      {
        text: 'Library',
        onPress: async () => {
          const result = await launchImageLibrary(options);
          processImageForOCR(result);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleSubmitJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('Empty', 'Please write something before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/journal/submit', { content: journalText });

      const streakRes = await apiClient.post('/profile/check-in');
      setStreak(streakRes.data.streak);

      Alert.alert(
        'Reflected',
        'Your journal has been saved and your streak updated!.',
      );
      setJournalText('');
      Keyboard.dismiss();
    } catch (err) {
      Alert.alert('Error', 'Failed to save your reflection.');
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
          <View style={styles.statusRow}>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>STREAK</Text>
              <Text style={styles.statusValue}>{streak ?? 0} 🔥</Text>
            </View>
            <View style={styles.statusBubble}>
              <Text style={styles.statusLabel}>MOOD</Text>
              <Text style={styles.statusValue}>Happy 😊</Text>
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
                textAlignVertical="top"
                value={journalText}
                onChangeText={setJournalText}
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
                    !journalText.trim() && styles.disabledBtn,
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
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.activityCard}>
                  <MaterialIcons name={item.icon} size={32} color="#004346" />
                  <Text style={styles.activityLabel}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateSettings={onNavigateSettings}
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
  statusRow: { flexDirection: 'row', gap: 15 },
  statusBubble: {
    flex: 1,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#004346',
    marginTop: 4,
  },
  journalCard: {
    marginTop: 25,
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
  disabledBtn: { opacity: 0.5 },
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
});

export default HomeScreen;
