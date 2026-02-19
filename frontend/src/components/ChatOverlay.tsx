import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from './GradientBackground';
import apiClient from '../api/client';

const BreathingAvatar = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.avatarContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image
          source={require('../assets/logo_light.png')}
          style={styles.miniLogo}
        />
      </Animated.View>
    </View>
  );
};

const ChatOverlay = ({ visible, onClose, sessionId = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (sessionId) {
        setActiveSessionId(sessionId);
        fetchHistory(sessionId);
      } else {
        startNewChat();
      }
    } else {
      setMessages([]);
      setActiveSessionId(null);
    }
  }, [visible, sessionId]);

  const startNewChat = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/chat/new-session');
      setActiveSessionId(response.data.session_id);
      setMessages([
        {
          id: 'welcome',
          text: "Hi, I'm Hansei. Let's take a moment to reflect together. What's on your mind?",
          sender: 'ai',
        },
      ]);
    } catch (error) {
      console.error('New session error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async id => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/chat/history/${id}`);
      setMessages(response.data.history);
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeSessionId) return;

    const userMsgText = inputText.trim();
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), text: userMsgText, sender: 'user' },
    ]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await apiClient.post('/chat', {
        message: userMsgText,
        session_id: activeSessionId,
      });
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response.data.reply,
          sender: 'ai',
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err',
          text: "I'm having a quiet moment. Let's try again soon.",
          sender: 'ai',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isAi = item.sender === 'ai';
    return (
      <View
        style={[
          styles.messageWrapper,
          isAi ? styles.aiWrapper : styles.userWrapper,
        ]}
      >
        {isAi && <BreathingAvatar />}
        <View
          style={[styles.bubble, isAi ? styles.aiBubble : styles.userBubble]}
        >
          <Text
            style={[styles.messageText, isAi ? styles.aiText : styles.userText]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <GradientBackground />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <MaterialIcons name="expand-more" size={32} color="#004346" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Hansei</Text>
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Listening</Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#004346" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.inputSection}>
              {isTyping && (
                <View style={styles.typingContainer}>
                  <ActivityIndicator
                    size="small"
                    color="#004346"
                    style={{ transform: [{ scale: 0.5 }] }}
                  />
                  <Text style={styles.typingText}>Hansei is reflecting...</Text>
                </View>
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Share your thoughts..."
                  placeholderTextColor="rgba(0, 67, 70, 0.4)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={[
                    styles.sendBtn,
                    !inputText.trim() && styles.sendBtnDisabled,
                  ]}
                  disabled={!inputText.trim() || isTyping}
                >
                  <MaterialIcons name="arrow-upward" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#004346' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004346',
    opacity: 0.5,
    textTransform: 'uppercase',
  },

  messageList: { paddingHorizontal: 20, paddingBottom: 20 },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-end',
  },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },

  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#004346',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#004346',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  miniLogo: { width: 30, height: 30, resizeMode: 'contain' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  userBubble: { backgroundColor: '#004346', borderBottomRightRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22 },
  aiText: { color: '#004346', fontWeight: '500' },
  userText: { color: '#fff', fontWeight: '500' },

  inputSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 5,
  },
  typingText: {
    fontSize: 12,
    color: '#004346',
    opacity: 0.6,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  textInput: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#004346',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#004346',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { padding: 5 },
});

export default ChatOverlay;
