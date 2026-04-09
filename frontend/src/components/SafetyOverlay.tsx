import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const BreathingCircle = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const [instruction, setInstruction] = useState('Breathe...');

  useEffect(() => {
    const breathe = () => {
      setInstruction('In...');
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInstruction('Out...');
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]).start(() => breathe());
      });
    };
    breathe();
    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.breathingContainer}>
      <Animated.View
        style={[
          styles.circle,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      />
      <Text style={styles.breathingText}>{instruction}</Text>
    </View>
  );
};

const SafetyOverlay = ({ visible, helplines, onResolve }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [typedText, setTypedText] = useState('');
  const [showGrounding, setShowGrounding] = useState(false);

  useEffect(() => {
    let timer;
    if (visible && cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [visible, cooldown]);

  useEffect(() => {
    if (visible) {
      setCooldown(30);
      setTypedText('');
      setShowGrounding(false);
    }
  }, [visible]);

  const isUnlockValid =
    typedText.trim().toLowerCase() === 'i am safe' ||
    typedText.trim().toLowerCase() === 'i want to continue';

  const handleUnlock = async () => {
    if (!isUnlockValid) return;
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      await apiClient.post('/chat/resolve-crisis', { declaration: typedText });
      onResolve();
    } catch (err) {
      Alert.alert('Error', 'Could not verify safety status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.innerContainer}>
            <View style={styles.center}>
              <MaterialIcons name="favorite" size={32} color="#D32F2F" />
              <Text style={styles.title}>You are not alone.</Text>
              <Text style={styles.message}>
                Human help is available. We want to make sure you stay safe.
              </Text>
            </View>

            <View style={styles.helplineBox}>
              {helplines?.slice(0, 3).map(
                (
                  line,
                  idx, 
                ) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.helplineItemBtn}
                    onPress={() =>
                      line.url
                        ? Linking.openURL(line.url)
                        : Linking.openURL(`tel:${line.number}`)
                    }
                  >
                    <MaterialIcons
                      name={line.url ? 'language' : 'phone'}
                      size={20}
                      color="#fff"
                    />
                    <View style={styles.helplineTextWrapper}>
                      <Text style={styles.helplineNameBtn}>{line.name}</Text>
                      <Text style={styles.helplineNumberBtn}>
                        {line.number || 'Visit Website'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <View style={styles.center}>
              {!showGrounding ? (
                <TouchableOpacity
                  style={styles.groundingBtn}
                  onPress={() => setShowGrounding(true)}
                >
                  <MaterialIcons
                    name="self-improvement"
                    size={18}
                    color="#004346"
                  />
                  <Text style={styles.groundingBtnText}>
                    Try a calming breath?
                  </Text>
                </TouchableOpacity>
              ) : (
                <BreathingCircle />
              )}
            </View>

            <View style={styles.actionBox}>
              {cooldown > 0 ? (
                <View style={styles.cooldownWrapper}>
                  <ActivityIndicator size="small" color="#004346" />
                  <Text style={styles.cooldownText}>
                    Unlock available in {cooldown}s
                  </Text>
                </View>
              ) : (
                <View style={styles.unlockWrapper}>
                  <Text style={styles.actionPrompt}>
                    Type <Text style={styles.bold}>"I am safe"</Text> to
                    continue
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder='Type "I am safe"'
                    value={typedText}
                    onChangeText={setTypedText}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[
                      styles.unlockBtn,
                      !isUnlockValid && styles.unlockBtnDisabled,
                    ]}
                    onPress={handleUnlock}
                    disabled={!isUnlockValid || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.unlockBtnText}>Return to App</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  center: { alignItems: 'center' },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D32F2F',
    marginTop: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 10,
  },

  helplineBox: { width: '100%', marginVertical: 10 },
  helplineItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004346',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    height: 60,
  },
  helplineTextWrapper: { marginLeft: 12 },
  helplineNameBtn: { fontSize: 15, fontWeight: '700', color: '#fff' },
  helplineNumberBtn: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  groundingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: 'rgba(0, 67, 70, 0.08)',
    borderRadius: 15,
  },
  groundingBtnText: { fontSize: 13, fontWeight: '700', color: '#004346' },

  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 67, 70, 0.2)',
    position: 'absolute',
  },
  breathingText: { fontSize: 14, fontWeight: '800', color: '#004346' },

  actionBox: { width: '100%', paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
  cooldownWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  cooldownText: { fontSize: 13, color: '#004346', fontWeight: '600' },

  unlockWrapper: { width: '100%' },
  actionPrompt: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  bold: { fontWeight: '800', color: '#333' },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  unlockBtn: {
    backgroundColor: '#004346',
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  unlockBtnDisabled: { opacity: 0.3 },
  unlockBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default SafetyOverlay;
