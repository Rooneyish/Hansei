import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const CBTLabScreen = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/cbt/history');
      setHistory(response.data);
    } catch (err) {
      console.log('Error fetching CBT history:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderLabCard = ({ item, index }) => (
    <View style={[styles.reportCard, index === 0 && styles.latestCard]}>
      {index === 0 && (
        <View style={styles.latestBadge}>
          <Text style={styles.latestBadgeText}>LATEST ANALYSIS</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <MaterialIcons name="psychology" size={28} color="#004346" />
        <Text style={styles.distortionTitle}>{item.distortion_type}</Text>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.label}>AUTOMATIC THOUGHT</Text>
        <View style={styles.thoughtBubble}>
          <Text style={styles.thoughtText}>"{item.original_thought}"</Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.reframeHeader}>
          <MaterialIcons name="auto-awesome" size={20} color="#004346" />
          <Text style={styles.reframeLabel}>HANSEI REFRAME</Text>
        </View>
        <Text style={styles.reframeText}>{item.reframed_thought}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.divider} />
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={35} color="#004346" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CBT Lab</Text>
          <View style={{ width: 45 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#004346" />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item.id.toString()}
            renderItem={renderLabCard}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.introSection}>
                <Text style={styles.sectionTitle}>
                  Cognitive Deconstruction
                </Text>
                <Text style={styles.sectionSub}>
                  Break down your thoughts to find clearer perspectives.
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="biotech"
                  size={80}
                  color="rgba(0,67,70,0.1)"
                />
                <Text style={styles.emptyText}>
                  Your Lab history is empty. Start journaling to generate your
                  first analysis.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#004346',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  introSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#004346' },
  sectionSub: { fontSize: 14, color: '#004346', opacity: 0.6, marginTop: 5 },

  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 35,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  latestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(0, 67, 70, 0.3)',
    borderWidth: 1.5,
  },
  latestBadge: {
    backgroundColor: '#004346',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  latestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  distortionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#004346',
    flex: 1,
  },

  contentSection: { marginBottom: 20 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 1,
    marginBottom: 8,
  },

  thoughtBubble: {
    backgroundColor: 'rgba(0, 67, 70, 0.05)',
    padding: 15,
    borderRadius: 22,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(0, 67, 70, 0.2)',
  },
  thoughtText: {
    fontSize: 15,
    color: '#004346',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  reframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reframeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#004346',
    letterSpacing: 1,
  },
  reframeText: {
    fontSize: 16,
    color: '#004346',
    fontWeight: '700',
    lineHeight: 24,
  },

  cardFooter: { marginTop: 10 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 67, 70, 0.1)',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#004346',
    opacity: 0.4,
    textAlign: 'right',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#004346',
    opacity: 0.5,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default CBTLabScreen;
