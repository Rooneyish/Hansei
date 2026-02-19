import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NavigationBar from '../components/NavigationBar';
import ChatOverlay from '../components/ChatOverlay';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

const HistoryScreen = ({
  onSelectChat,
  onNavigateHome,
  onNavigateInsights,
  onNavigateProfile,
  onNavigateChatHistory,
}) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [chatRes, activityRes] = await Promise.all([
        apiClient.get('/chat/sessions'),
        apiClient
          .get('/journal/activities')
          .catch(() => ({ data: { activities: [] } })),
      ]);
      setSessions(chatRes.data.sessions || []);
      setActivities(activityRes.data.activities || []);
    } catch (e) {
      console.log('Error fetching history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectChat(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="chat-bubble" size={22} color="#004346" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.dateLabel}>{formatDate(item.start_time)}</Text>
          <Text style={styles.mainText} numberOfLines={1}>
            {item.preview_text || 'Reflective Session'}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color="rgba(0, 67, 70, 0.3)"
        />
      </View>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
          ]}
        >
          <MaterialIcons
            name={
              item.type === 'music'
                ? 'headset'
                : item.type === 'zen'
                ? 'self-improvement'
                : 'psychology'
            }
            size={22}
            color="#004346"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.dateLabel}>{formatDate(item.created_at)}</Text>
          <Text style={styles.mainText}>
            {item.title || 'Practice Completed'}
          </Text>
          {item.duration && (
            <Text style={styles.subText}>{item.duration} min session</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <MaterialIcons name="sort" size={30} color="#004346" />
          <Image
            source={require('../assets/logo_dark.png')}
            style={styles.smallLogo}
          />
          <View style={{ width: 30 }} />
        </View>

        <Text style={styles.title}>History</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
            onPress={() => setActiveTab('chats')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'chats' && styles.activeTabText,
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
            onPress={() => setActiveTab('activities')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'activities' && styles.activeTabText,
              ]}
            >
              Activities
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#004346" />
          </View>
        ) : (
          <FlatList
            data={activeTab === 'chats' ? sessions : activities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={
              activeTab === 'chats' ? renderChatItem : renderActivityItem
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="history"
                  size={70}
                  color="rgba(0,67,70,0.1)"
                />
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#004346"
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <ChatOverlay
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />

      <NavigationBar
        onNavigateHome={onNavigateHome}
        onNavigateProfile={onNavigateProfile}
        onNavigateInsights={onNavigateInsights}
        onNavigateChatHistory={onNavigateChatHistory}
        onPressAI={() => setIsChatVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  smallLogo: { width: 50, height: 50, resizeMode: 'contain' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004346',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 25,
    borderRadius: 22,
    padding: 6,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: '#004346',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0, 67, 70, 0.5)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 30,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { flex: 1, marginLeft: 16 },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  mainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#004346',
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 67, 70, 0.5)',
  },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#004346',
    marginTop: 15,
  },
});

export default HistoryScreen;
