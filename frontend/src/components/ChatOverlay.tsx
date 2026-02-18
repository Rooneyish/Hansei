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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';

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
          text: "Hi! I'm Hansei. I've started a new session. How can I help you today?",
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
    const userMsgObj = {
      id: Date.now().toString(),
      text: userMsgText,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMsgObj]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      const response = await apiClient.post('/chat', {
        message: currentInput,
        session_id: activeSessionId,
      });

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: 'error',
          text: "Sorry, I'm having trouble connecting to my thoughts.",
          sender: 'ai',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.aiStatusDot} />
              <Text style={styles.headerText}>Hansei AI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#004346" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#004346" />
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
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.sender === 'user'
                      ? styles.userBubble
                      : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      item.sender === 'user' ? styles.userText : styles.aiText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              )}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.inputArea}>
              {isTyping && (
                <Text style={styles.typingIndicator}>
                  Hansei is thinking...
                </Text>
              )}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={[
                    styles.sendBtn,
                    (!inputText.trim() || isTyping) && { opacity: 0.5 },
                  ]}
                  disabled={!inputText.trim() || isTyping}
                >
                  <MaterialIcons name="send" size={24} color="#fff" />
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 40, 45, 0.85)' },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F0F7F7',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  headerText: { fontSize: 18, fontWeight: '800', color: '#004346' },
  messageList: { padding: 20, gap: 15, paddingBottom: 40 },
  messageBubble: { maxWidth: '85%', padding: 15, borderRadius: 22 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#004346',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#004346' },
  inputArea: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#004346',
    opacity: 0.5,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F7F7',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#004346',
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#004346',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ChatOverlay;
