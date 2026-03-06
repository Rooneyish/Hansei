import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import ChatOverlay from '../components/ChatOverlay';

const { width } = Dimensions.get('window');

const PLAYLIST = [
  {
    id: '1',
    title: 'Zen Garden',
    duration: '5:30',
    category: 'Meditation',
    artist: 'Hansei Audio',
  },
  {
    id: '2',
    title: 'Morning Reflection',
    duration: '10:00',
    category: 'Focus',
    artist: 'Hansei Audio',
  },
  {
    id: '3',
    title: 'Rain in Kyoto',
    duration: '15:00',
    category: 'Sleep',
    artist: 'Nature',
  },
  {
    id: '4',
    title: 'Deep Insight',
    duration: '8:45',
    category: 'CBT',
    artist: 'Hansei Audio',
  },
  {
    id: '5',
    title: 'Inner Peace',
    duration: '12:20',
    category: 'Zen',
    artist: 'Monk Chants',
  },
];

const MusicScreen = ({
  onBack,
}) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const renderTrackItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.trackCard,
        currentTrack?.id === item.id && styles.activeTrackCard,
      ]}
      onPress={() => {
        setCurrentTrack(item);
        setIsPlaying(true);
      }}
    >
      <View style={styles.trackInfo}>
        <View style={styles.iconCircle}>
          <MaterialIcons
            name={
              currentTrack?.id === item.id && isPlaying
                ? 'graphic-eq'
                : 'play-arrow'
            }
            size={24}
            color="#004346"
          />
        </View>
        <View>
          <Text style={styles.trackTitle}>{item.title}</Text>
          <Text style={styles.trackSubtext}>
            {item.category} • {item.duration}
          </Text>
        </View>
      </View>
      <MaterialIcons name="more-vert" size={24} color="rgba(0, 67, 70, 0.4)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={32} color="#004346" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mindful Music</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>DAILY PICK</Text>
          <Text style={styles.featuredTitle}>Deep Reflection</Text>
          <Text style={styles.featuredSub}>
            A 15-minute soundscape for your Hansei practice.
          </Text>
          <TouchableOpacity style={styles.playAllBtn}>
            <MaterialIcons
              name="play-circle-filled"
              size={50}
              color="#004346"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={PLAYLIST}
          keyExtractor={item => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {currentTrack && (
          <View style={styles.miniPlayer}>
            <View style={styles.playerInfo}>
              <Text style={styles.miniTrackTitle}>{currentTrack.title}</Text>
              <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.playerControls}>
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
                <MaterialIcons
                  name={
                    isPlaying ? 'pause-circle-filled' : 'play-circle-filled'
                  }
                  size={45}
                  color="#004346"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      <ChatOverlay
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#004346' },
  featuredCard: {
    margin: 20,
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    position: 'relative',
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#004346',
    opacity: 0.5,
    letterSpacing: 2,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#004346',
    marginTop: 5,
  },
  featuredSub: {
    fontSize: 14,
    color: '#004346',
    opacity: 0.7,
    marginTop: 5,
    width: '70%',
  },
  playAllBtn: { position: 'absolute', right: 20, bottom: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeTrackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#004346',
  },
  trackInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackTitle: { fontSize: 16, fontWeight: '700', color: '#004346' },
  trackSubtext: { fontSize: 12, color: '#004346', opacity: 0.5 },
  miniPlayer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  miniTrackTitle: { fontSize: 16, fontWeight: '800', color: '#004346' },
  miniArtist: { fontSize: 12, color: '#004346', opacity: 0.6 },
});

export default MusicScreen;
