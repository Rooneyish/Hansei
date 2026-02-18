import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import NavigationBar from '../components/NavigationBar';
import ChatOverlay from '../components/ChatOverlay';
import GradientBackground from '../components/GradientBackground';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../api/client';

const HistoryScreen = ({
  onSelectChat,
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateChatHistory,
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/chat/sessions');
      setSessions(res.data.sessions);
    } catch (e) {
      console.log('Error fetching sessions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectChat(item.id)}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="chat-bubble-outline" size={24} color="#004346" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.dateText}>
            {new Date(item.start_time).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.previewText} numberOfLines={1}>
            {item.preview_text}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color="rgba(0,67,70,0.3)"
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <GradientBackground />
      <MaterialIcons name="History" size={80} color="rgba(0,67,70,0.1)" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Your chats with Hansei will appear here so you can look back on your
        progress.
      </Text>
    </View>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004346" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation History</Text>
      <FlatList
        data={sessions}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#004346"
          />
        }
        contentContainerStyle={styles.listContent}
      />
      <ChatOverlay
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateChatHistory={onNavigateChatHistory}
        onPressAI={()=>setIsChatVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1},
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004346',
    paddingHorizontal: 25,
    marginTop: 60,
    marginBottom: 20,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#004346',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,67,70,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { flex: 1, marginLeft: 15 },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,67,70,0.4)',
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004346',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004346',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(0,67,70,0.5)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});

export default HistoryScreen;
